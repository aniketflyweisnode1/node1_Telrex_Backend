const Doctor = require('../../models/Doctor.model');
const User = require('../../models/User.model');
const Specialization = require('../../models/Specialization.model');
const mongoose = require('mongoose');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');
const bcrypt = require('bcryptjs');

// Get statistics for overview cards
exports.getStatistics = async () => {
  try {
    // Get current month dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    // Get last month dates
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    
    // Total providers (current month)
    const totalProviders = await Doctor.countDocuments({ isActive: true });
    
    // Total providers (last month) for comparison
    const lastMonthProviders = await Doctor.countDocuments({
      isActive: true,
      createdAt: { $lte: lastMonthEnd }
    });
    
    // Calculate percentage change
    const totalProvidersChange = lastMonthProviders > 0 
      ? ((totalProviders - lastMonthProviders) / lastMonthProviders) * 100 
      : 0;
    
    // Status counts
    const statusCounts = await Doctor.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statusMap = {
      active: 0,
      pending: 0,
      suspended: 0
    };
    
    statusCounts.forEach(item => {
      if (statusMap.hasOwnProperty(item._id)) {
        statusMap[item._id] = item.count;
      }
    });
    
    // Calculate average rating (current month)
    const doctorsWithRatingsCurrent = await Doctor.aggregate([
      { $match: { isActive: true, 'rating.totalRatings': { $gt: 0 } } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating.average' },
          totalRatings: { $sum: '$rating.totalRatings' }
        }
      }
    ]);
    
    const avgProviderRating = doctorsWithRatingsCurrent.length > 0 
      ? doctorsWithRatingsCurrent[0].avgRating 
      : 0;
    
    // Average rating (last month) for comparison
    const doctorsWithRatingsLastMonth = await Doctor.aggregate([
      { 
        $match: { 
          isActive: true, 
          'rating.totalRatings': { $gt: 0 },
          createdAt: { $lte: lastMonthEnd }
        } 
      },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating.average' }
        }
      }
    ]);
    
    const lastMonthAvgRating = doctorsWithRatingsLastMonth.length > 0 
      ? doctorsWithRatingsLastMonth[0].avgRating 
      : 0;
    
    // Calculate percentage change for rating
    const avgRatingChange = lastMonthAvgRating > 0 
      ? ((avgProviderRating - lastMonthAvgRating) / lastMonthAvgRating) * 100 
      : 0;

    // Payouts pending - get from DoctorPayout model
    const DoctorPayout = require('../../models/DoctorPayout.model');
    const pendingPayouts = await DoctorPayout.aggregate([
      { 
        $match: { 
          status: { $in: ['pending', 'processing'] }
        } 
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          providerCount: { $addToSet: '$doctor' } // Get unique doctors
        }
      }
    ]);
    
    const payoutsPending = {
      amount: pendingPayouts.length > 0 ? pendingPayouts[0].totalAmount : 0,
      providerCount: pendingPayouts.length > 0 ? pendingPayouts[0].providerCount.length : 0
    };

    const statistics = {
      totalProviders: {
        value: totalProviders,
        change: parseFloat(totalProvidersChange.toFixed(2)),
        changeType: totalProvidersChange >= 0 ? 'increase' : 'decrease'
      },
      payoutsPending: {
        amount: payoutsPending.amount,
        providerCount: payoutsPending.providerCount
      },
      avgProviderRating: {
        value: parseFloat(avgProviderRating.toFixed(1)),
        change: parseFloat(avgRatingChange.toFixed(2)),
        changeType: avgRatingChange >= 0 ? 'increase' : 'decrease'
      },
      statusCounts: {
        all: totalProviders,
        active: statusMap.active,
        pending: statusMap.pending,
        suspended: statusMap.suspended
      }
    };

    logger.info('Doctor statistics retrieved', {
      totalProviders: statistics.totalProviders.value,
      avgProviderRating: statistics.avgProviderRating.value,
      payoutsPending: statistics.payoutsPending
    });

    return statistics;
  } catch (err) {
    logger.error('Error retrieving doctor statistics', {
      error: err.message,
      stack: err.stack
    });
    throw err;
  }
};

// Create doctor
exports.createDoctor = async (adminId, data) => {
  const { 
    firstName, 
    lastName, 
    email, 
    phoneNumber, 
    countryCode, 
    specialty, // Now accepts specialization ID
    licenseNumber, 
    licenseVerified, 
    consultationFee, 
    status,
    password 
  } = data;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: email?.toLowerCase() },
      { phoneNumber }
    ]
  });

  if (existingUser) {
    logger.warn('Doctor creation failed - User already exists', { email, phoneNumber });
    throw new AppError('User with this email or phone number already exists', 409);
  }

  // Check if license number already exists
  const existingDoctor = await Doctor.findOne({ licenseNumber });
  if (existingDoctor) {
    logger.warn('Doctor creation failed - License number already exists', { licenseNumber });
    throw new AppError('Doctor with this license number already exists', 409);
  }

  // Validate specialization exists
  const Specialization = require('../../models/Specialization.model');
  if (!mongoose.Types.ObjectId.isValid(specialty)) {
    throw new AppError('Invalid specialization ID format', 400);
  }
  const specialization = await Specialization.findById(specialty);
  if (!specialization) {
    throw new AppError('Specialization not found', 404);
  }
  if (!specialization.isActive) {
    throw new AppError('Cannot assign inactive specialization to doctor', 400);
  }

  // Create user with doctor role
  const user = await User.create({
    firstName,
    lastName,
    email: email?.toLowerCase(),
    phoneNumber,
    countryCode: countryCode || '+91',
    password: password || 'Doctor@123',
    role: 'doctor',
    isVerified: licenseVerified || false,
    isActive: status === 'active',
    agreeConfirmation: true,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined
  });

  // Prepare doctor data
  const doctorData = {
    user: user._id,
    specialty,
    licenseNumber,
    licenseVerified: licenseVerified || false,
    consultationFee,
    status: status || 'pending',
    createdBy: adminId,
    isActive: true
  };

  // Add optional fields
  if (data.experience !== undefined) doctorData.experience = data.experience;
  if (data.education) doctorData.education = data.education;
  if (data.certifications) {
    // Handle both issuingOrganization and issuedBy
    doctorData.certifications = data.certifications.map(cert => ({
      name: cert.name,
      issuingOrganization: cert.issuingOrganization || cert.issuedBy,
      issuedBy: cert.issuedBy || cert.issuingOrganization,
      issueDate: cert.issueDate ? new Date(cert.issueDate) : undefined,
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
      year: cert.year
    }));
  }
  if (data.languages) doctorData.languages = data.languages;
  if (data.availability) doctorData.availability = data.availability;
  if (data.address) doctorData.address = data.address;
  if (data.profilePicture) doctorData.profilePicture = data.profilePicture;
  if (data.bio) doctorData.bio = data.bio;

  // Create doctor record
  const doctor = await Doctor.create(doctorData);

  if (licenseVerified) {
    doctor.licenseVerifiedAt = new Date();
    doctor.licenseVerifiedBy = adminId;
    await doctor.save();
  }

  logger.info('Doctor created successfully', {
    doctorId: doctor._id,
    userId: user._id,
    createdBy: adminId,
    specialty,
    licenseNumber
  });

  await doctor.populate('user', 'firstName lastName email phoneNumber countryCode role isActive createdAt gender dateOfBirth');
  await doctor.populate('specialty', 'name description isActive');
  await doctor.populate('createdBy', 'firstName lastName email');

  return doctor;
};

// Doctor signup (self-registration)
exports.doctorSignup = async (data, files = {}) => {
  const {
    firstName,
    lastName,
    middleInitial,
    email,
    phoneNumber,
    countryCode,
    gender,
    dateOfBirth,
    specialty,
    licenseNumber,
    experience,
    hospitalAffiliation,
    languages,
    bio,
    consultationFee,
    password,
    agreeConfirmation
  } = data;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: email?.toLowerCase() },
      { phoneNumber }
    ]
  });

  if (existingUser) {
    logger.warn('Doctor signup failed - User already exists', { email, phoneNumber });
    throw new AppError('User with this email or phone number already exists', 409);
  }

  // Check if license number already exists
  const existingDoctor = await Doctor.findOne({ licenseNumber });
  if (existingDoctor) {
    logger.warn('Doctor signup failed - License number already exists', { licenseNumber });
    throw new AppError('Doctor with this license number already exists', 409);
  }

  // Validate specialization exists
  const Specialization = require('../../models/Specialization.model');
  if (!mongoose.Types.ObjectId.isValid(specialty)) {
    throw new AppError('Invalid specialization ID format', 400);
  }
  const specialization = await Specialization.findById(specialty);
  if (!specialization) {
    throw new AppError('Specialization not found', 404);
  }
  if (!specialization.isActive) {
    throw new AppError('Cannot assign inactive specialization to doctor', 400);
  }

  // Set password (will be hashed by User model's pre-save hook)
  // Don't hash here - let the User model handle it to avoid double hashing
  const userPassword = password || phoneNumber.slice(-6);

  // Create user with doctor role
  const user = await User.create({
    firstName,
    lastName,
    email: email?.toLowerCase(),
    phoneNumber,
    countryCode: countryCode || '+91',
    password: userPassword, // Will be hashed by pre-save hook
    role: 'doctor',
    isVerified: false,
    isActive: false, // Inactive until admin verifies
    agreeConfirmation: agreeConfirmation || false,
    gender: gender,
    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
  });

  // Prepare doctor data
  const doctorData = {
    user: user._id,
    specialty,
    licenseNumber,
    licenseVerified: false,
    consultationFee: consultationFee || 0,
    status: 'pending',
    createdBy: user._id, // Self-created
    isActive: false // Inactive until verified
  };

  // Add optional fields
  if (experience !== undefined) doctorData.experience = experience;
  if (bio) doctorData.bio = bio;
  if (languages && languages.length > 0) {
    doctorData.languages = Array.isArray(languages) ? languages : [languages];
  }
  if (hospitalAffiliation) {
    doctorData.address = doctorData.address || {};
    doctorData.address.clinicName = hospitalAffiliation;
  }

  // Handle file uploads - support both multipart/form-data and JSON with file URLs
  // If files are uploaded via multer
  if (files && files.profilePicture && files.profilePicture.length > 0) {
    const profilePictureUrl = `/uploads/${files.profilePicture[0].filename}`;
    doctorData.profilePicture = profilePictureUrl;
    doctorData.profileImage = {
      url: profilePictureUrl,
      verified: false
    };
  }
  // If profile picture is provided as URL in JSON body
  else if (data.profilePicture) {
    const profilePictureUrl = data.profilePicture.startsWith('/') ? data.profilePicture : `/uploads/${data.profilePicture}`;
    doctorData.profilePicture = profilePictureUrl;
    doctorData.profileImage = {
      url: profilePictureUrl,
      verified: false
    };
  }

  // If medical license is uploaded via multer
  if (files && files.medicalLicense && files.medicalLicense.length > 0) {
    const licenseDocUrl = `/uploads/${files.medicalLicense[0].filename}`;
    doctorData.medicalLicense = {
      licenseNumber: licenseNumber,
      documentUrl: licenseDocUrl,
      verified: false
    };
  }
  // If medical license is provided as URL in JSON body
  else if (data.medicalLicense) {
    const licenseDocUrl = data.medicalLicense.startsWith('/') ? data.medicalLicense : `/uploads/${data.medicalLicense}`;
    doctorData.medicalLicense = {
      licenseNumber: licenseNumber,
      documentUrl: licenseDocUrl,
      verified: false
    };
  }

  // Create doctor record
  const doctor = await Doctor.create(doctorData);

  logger.info('Doctor signup successful', {
    doctorId: doctor._id,
    userId: user._id,
    specialty,
    licenseNumber,
    email
  });

  await doctor.populate('user', 'firstName lastName email phoneNumber countryCode role isActive createdAt gender dateOfBirth');
  await doctor.populate('specialty', 'name description isActive');

  return { doctor, user };
};

// Get all doctors with search and pagination
exports.getAllDoctors = async (query) => {
  const { search, page = 1, limit = 10, specialty, status, licenseVerified, isActive } = query;
  
  let filter = {};
  
  // Search filter - search in user fields, specialty, and license number
  if (search) {
    // First, find users that match the search criteria
    const userSearchFilter = {
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ]
    };
    
    const matchingUsers = await User.find(userSearchFilter).select('_id');
    const userIds = matchingUsers.map(u => u._id);
    
    // Also check if search matches license number or specialty (now from Specialization model)
    const searchRegex = new RegExp(search, 'i');
    
    // Find specializations that match the search term
    let specializationIds = [];
    try {
      const matchingSpecializations = await Specialization.find({
        name: { $regex: search, $options: 'i' },
        isActive: true
      }).select('_id').lean();
      // Ensure all IDs are valid ObjectIds and convert to ObjectId instances
      specializationIds = matchingSpecializations
        .map(s => s._id)
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => new mongoose.Types.ObjectId(id));
    } catch (err) {
      // If Specialization query fails, just skip specialization search
      logger.warn('Error searching specializations', { error: err.message });
    }
    
    // Build search filter
    const searchConditions = [];
    
    // If users found, add user filter
    if (userIds.length > 0) {
      searchConditions.push({ user: { $in: userIds } });
    }
    
    // If specialty matches, add specialty filter (using ObjectId)
    // Only add if we have valid ObjectIds
    if (specializationIds.length > 0) {
      // Ensure all IDs are ObjectId instances before using in $in query
      const validSpecializationIds = specializationIds
        .filter(id => mongoose.Types.ObjectId.isValid(id))
        .map(id => id instanceof mongoose.Types.ObjectId ? id : new mongoose.Types.ObjectId(id));
      if (validSpecializationIds.length > 0) {
        searchConditions.push({ specialty: { $in: validSpecializationIds } });
      }
    }
    
    // If license number matches
    if (searchRegex.test(search)) {
      searchConditions.push({ licenseNumber: { $regex: search, $options: 'i' } });
    }
    
    // If no matches found, return empty result
    if (searchConditions.length === 0) {
      return {
        doctors: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      };
    }
    
    // Combine search conditions with OR
    filter.$or = searchConditions;
  }

  // Specialty filter (now accepts ObjectId or name - dynamic lookup from Specialization model)
  if (specialty) {
    try {
      let specialtyId = null;
      
      // Always lookup specialization dynamically - support both ObjectId and name
      if (mongoose.Types.ObjectId.isValid(specialty)) {
        // If it's a valid ObjectId, find by ID
        const specialization = await Specialization.findById(specialty).lean();
        if (!specialization || !specialization.isActive) {
          // If specialization doesn't exist or is inactive, return empty results
          return {
            doctors: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0
            }
          };
        }
        // Convert to ObjectId to ensure it's the correct type
        specialtyId = new mongoose.Types.ObjectId(specialization._id);
      } else {
        // If not a valid ObjectId, it must be a name - find by name dynamically
        const specialization = await Specialization.findOne({ 
          name: { $regex: new RegExp(`^${specialty}$`, 'i') },
          isActive: true 
        }).lean();
        
        if (!specialization) {
          // Specialization not found by name, return empty results
          return {
            doctors: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0
            }
          };
        }
        // Convert to ObjectId to ensure it's the correct type
        specialtyId = new mongoose.Types.ObjectId(specialization._id);
      }
      
      // Ensure specialtyId is a valid ObjectId before using in filter
      if (!specialtyId || !mongoose.Types.ObjectId.isValid(specialtyId)) {
        logger.warn('Invalid specialty ID after lookup', { specialty, specialtyId });
        return {
          doctors: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
        };
      }
      
      // Apply specialty filter
      if (filter.$or) {
        const searchFilter = { $or: filter.$or };
        filter = {
          $and: [
            searchFilter,
            { specialty: specialtyId }
          ]
        };
      } else {
        filter.specialty = specialtyId;
      }
    } catch (err) {
      // If specialty lookup fails, return empty results
      logger.warn('Error looking up specialty', { specialty, error: err.message, stack: err.stack });
      return {
        doctors: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      };
    }
  }

  // Status filter
  if (status) {
    if (filter.$and) {
      filter.$and.push({ status: status });
    } else if (filter.$or) {
      const existingFilter = { ...filter };
      filter = {
        $and: [
          existingFilter,
          { status: status }
        ]
      };
    } else {
      filter.status = status;
    }
  }

  // License verified filter
  if (licenseVerified !== undefined) {
    const isVerified = licenseVerified === 'true' || licenseVerified === true;
    if (filter.$and) {
      filter.$and.push({ licenseVerified: isVerified });
    } else if (filter.$or) {
      const existingFilter = { ...filter };
      filter = {
        $and: [
          existingFilter,
          { licenseVerified: isVerified }
        ]
      };
    } else {
      filter.licenseVerified = isVerified;
    }
  }

  // Active status filter
  if (isActive !== undefined) {
    const isActiveValue = isActive === 'true' || isActive === true;
    if (filter.$and) {
      filter.$and.push({ isActive: isActiveValue });
    } else if (filter.$or) {
      const existingFilter = { ...filter };
      filter = {
        $and: [
          existingFilter,
          { isActive: isActiveValue }
        ]
      };
    } else {
      filter.isActive = isActiveValue;
    }
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Build populate options with error handling for specialty
  const populateOptions = [
    { path: 'user', select: 'firstName lastName email phoneNumber countryCode role isActive createdAt gender dateOfBirth' },
    {
      path: 'specialty',
      select: 'name description',
      // Match only active specializations and handle null/invalid IDs gracefully
      match: { isActive: true },
      // If specialty is invalid or doesn't exist, set it to null instead of throwing error
      options: { lean: true }
    },
    { path: 'createdBy', select: 'firstName lastName email' },
    { path: 'licenseVerifiedBy', select: 'firstName lastName email' }
  ];

  const doctors = await Doctor.find(filter)
    .populate(populateOptions)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Doctor.countDocuments(filter);

  const result = {
    doctors,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };

  logger.info('Doctors retrieved', {
    count: doctors.length,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
  });

  return result;
};

// Get doctors by specialization (Public API)
exports.getDoctorsBySpecialization = async (specializationIdOrName, query = {}) => {
  const { page = 1, limit = 10, status, minRating, maxRating, sortBy = 'rating', sortOrder = 'desc' } = query;
  
  let filter = {
    isActive: true,
    status: 'active' // Only return active doctors for public API
  };

  // Find specialization by ID or name
  let specialtyId = null;
  try {
    if (mongoose.Types.ObjectId.isValid(specializationIdOrName)) {
      // If it's a valid ObjectId, find by ID
      const specialization = await Specialization.findById(specializationIdOrName).lean();
      if (!specialization || !specialization.isActive) {
        return {
          doctors: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          },
          specialization: null
        };
      }
      specialtyId = new mongoose.Types.ObjectId(specialization._id);
    } else {
      // If not a valid ObjectId, it must be a name - find by name dynamically
      const specialization = await Specialization.findOne({ 
        name: { $regex: new RegExp(`^${specializationIdOrName}$`, 'i') },
        isActive: true 
      }).lean();
      
      if (!specialization) {
        return {
          doctors: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          },
          specialization: null
        };
      }
      specialtyId = new mongoose.Types.ObjectId(specialization._id);
    }
  } catch (err) {
    logger.error('Error finding specialization', { error: err.message, specializationIdOrName });
    return {
      doctors: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0
      },
      specialization: null
    };
  }

  // Apply specialty filter
  filter.specialty = specialtyId;

  // Status filter (optional, defaults to 'active')
  if (status && ['active', 'pending', 'suspended'].includes(status)) {
    filter.status = status;
  }

  // Rating filters
  if (minRating !== undefined || maxRating !== undefined) {
    filter['rating.average'] = {};
    if (minRating !== undefined) {
      filter['rating.average'].$gte = parseFloat(minRating);
    }
    if (maxRating !== undefined) {
      filter['rating.average'].$lte = parseFloat(maxRating);
    }
  }

  // Sort options
  let sort = {};
  if (sortBy === 'rating') {
    sort['rating.average'] = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'consultationFee') {
    sort.consultationFee = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'experience') {
    sort.experience = sortOrder === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = sortOrder === 'asc' ? 1 : -1;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get specialization details
  const specialization = await Specialization.findById(specialtyId).lean();

  // Build populate options
  const populateOptions = [
    { 
      path: 'user', 
      select: 'firstName lastName email phoneNumber countryCode role isActive gender dateOfBirth profileImage' 
    },
    {
      path: 'specialty',
      select: 'name description',
      match: { isActive: true }
    }
  ];

  const doctors = await Doctor.find(filter)
    .populate(populateOptions)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Doctor.countDocuments(filter);

  const result = {
    doctors,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    },
    specialization: specialization || null
  };

  logger.info('Doctors retrieved by specialization', {
    specializationIdOrName,
    specialization: specialization?.name,
    count: doctors.length,
    total,
    page: parseInt(page),
    limit: parseInt(limit)
  });

  return result;
};

// Get filter options (simplified list for dropdowns)
exports.getFilterOptions = async () => {
  try {
    const doctors = await Doctor.find({ isActive: true, status: 'active' })
      .populate('user', 'firstName lastName email')
      .populate('specialty', 'name')
      .select('user specialty consultationFee rating status')
      .lean()
      .then(docs => docs.map(doc => ({
        _id: doc._id,
        name: doc.user ? `${doc.user.firstName} ${doc.user.lastName}` : 'Unknown',
        email: doc.user?.email,
        specialty: doc.specialty?.name || 'N/A',
        consultationFee: doc.consultationFee,
        rating: doc.rating?.average || 0
      })));

    return doctors;
  } catch (error) {
    logger.error('Error fetching doctor filter options', { error: error.message });
    throw new AppError(`Error fetching doctor filter options: ${error.message}`, 500);
  }
};

// Get doctor by ID
exports.getDoctorById = async (doctorId) => {
  // Validate doctorId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new AppError('Invalid doctor ID format', 400);
  }
  try {
    const doctor = await Doctor.findById(doctorId)
      .populate('user', 'firstName lastName email phoneNumber countryCode role isActive createdAt gender dateOfBirth')
      .populate('specialty', 'name description')
      .populate('createdBy', 'firstName lastName email')
      .populate('licenseVerifiedBy', 'firstName lastName email');

    if (!doctor) {
      logger.warn('Doctor not found', { doctorId });
      throw new AppError('Doctor not found', 404);
    }

    logger.info('Doctor retrieved by ID', {
      doctorId,
      specialty: doctor.specialty,
      status: doctor.status
    });

    return doctor;
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error('Error retrieving doctor by ID', {
      doctorId,
      error: err.message,
      stack: err.stack
    });
    throw err;
  }
};

// Update doctor
exports.updateDoctor = async (doctorId, data) => {
  // Validate doctorId is a valid MongoDB ObjectId
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    logger.error('Invalid doctor ID format', { doctorId });
    throw new AppError('Invalid doctor ID format', 400);
  }

  const { 
    firstName, 
    lastName, 
    email, 
    phoneNumber, 
    countryCode, 
    specialty, 
    licenseNumber, 
    licenseVerified, 
    consultationFee, 
    status,
    profilePicture,
    profileImage,
    medicalLicense,
    bio,
    experience,
    education,
    certifications,
    languages,
    availability,
    address,
    bankAccount
  } = data;

  // Convert to ObjectId for proper querying
  const doctorObjectId = new mongoose.Types.ObjectId(doctorId);
  
  // Find doctor by ID and populate user
  const doctor = await Doctor.findById(doctorObjectId).populate('user');
  if (!doctor) {
    // Check if any doctor exists with this ID format (for debugging)
    const allDoctors = await Doctor.find({}).limit(5).select('_id specialty');
    logger.warn('Doctor update failed - Doctor not found', { 
      doctorId,
      doctorObjectId: doctorObjectId.toString(),
      isValidObjectId: mongoose.Types.ObjectId.isValid(doctorId),
      sampleDoctorIds: allDoctors.map(d => d._id.toString())
    });
    throw new AppError(`Doctor not found with ID: ${doctorId}`, 404);
  }

  // Update user data
  if (firstName) doctor.user.firstName = firstName;
  if (lastName) doctor.user.lastName = lastName;
  if (data.gender !== undefined) doctor.user.gender = data.gender;
  if (data.dateOfBirth !== undefined) {
    doctor.user.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  }
  
  // Check email uniqueness if being updated
  if (email) {
    const emailLower = email.toLowerCase();
    if (emailLower !== doctor.user.email) {
      const existingUser = await User.findOne({ 
        email: emailLower,
        _id: { $ne: doctor.user._id }
      });
      if (existingUser) {
        logger.warn('Doctor update failed - Email already exists', { 
          doctorId, 
          email: emailLower 
        });
        throw new AppError('Email already exists for another user', 409);
      }
      doctor.user.email = emailLower;
    }
  }
  
  // Check phone number uniqueness if being updated
  if (phoneNumber) {
    if (phoneNumber !== doctor.user.phoneNumber) {
      const existingUser = await User.findOne({ 
        phoneNumber,
        _id: { $ne: doctor.user._id }
      });
      if (existingUser) {
        logger.warn('Doctor update failed - Phone number already exists', { 
          doctorId, 
          phoneNumber 
        });
        throw new AppError('Phone number already exists for another user', 409);
      }
      doctor.user.phoneNumber = phoneNumber;
    }
  }
  
  if (countryCode) doctor.user.countryCode = countryCode;
  if (status !== undefined) {
    doctor.user.isActive = status === 'active';
  }
  await doctor.user.save();

  // Update doctor data
  if (specialty) doctor.specialty = specialty;
  if (licenseNumber) {
    // Check if license number already exists for another doctor
    const existingDoctor = await Doctor.findOne({ 
      licenseNumber, 
      _id: { $ne: doctorId } 
    });
    if (existingDoctor) {
      logger.warn('Doctor update failed - License number already exists', { 
        doctorId, 
        licenseNumber 
      });
      throw new AppError('License number already exists for another doctor', 409);
    }
    doctor.licenseNumber = licenseNumber;
  }
  if (licenseVerified !== undefined) {
    doctor.licenseVerified = licenseVerified;
    if (licenseVerified && !doctor.licenseVerifiedAt) {
      doctor.licenseVerifiedAt = new Date();
      doctor.licenseVerifiedBy = data.verifiedBy || doctor.createdBy; // Admin ID
    } else if (!licenseVerified) {
      doctor.licenseVerifiedAt = null;
      doctor.licenseVerifiedBy = null;
    }
  }
  if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
  if (status) {
    doctor.status = status;
    doctor.user.isActive = status === 'active';
    await doctor.user.save();
  }
  // Update profile picture (legacy field)
  if (profilePicture !== undefined) doctor.profilePicture = profilePicture;
  
  // Update profile image (new structure)
  if (profileImage !== undefined) {
    if (profileImage.url !== undefined) {
      doctor.profileImage = doctor.profileImage || {};
      doctor.profileImage.url = profileImage.url;
    }
    if (profileImage.verified !== undefined) {
      doctor.profileImage = doctor.profileImage || {};
      doctor.profileImage.verified = profileImage.verified;
    }
    // Also update legacy profilePicture for backward compatibility
    if (profileImage.url) {
      doctor.profilePicture = profileImage.url;
    }
  }
  
  // Update medical license (new structure)
  if (medicalLicense !== undefined) {
    doctor.medicalLicense = doctor.medicalLicense || {};
    if (medicalLicense.licenseNumber !== undefined) {
      // Check if license number already exists for another doctor
      if (medicalLicense.licenseNumber && medicalLicense.licenseNumber !== doctor.licenseNumber) {
        const existingDoctor = await Doctor.findOne({ 
          licenseNumber: medicalLicense.licenseNumber, 
          _id: { $ne: doctorObjectId } 
        });
        if (existingDoctor) {
          logger.warn('Doctor update failed - License number already exists', { 
            doctorId, 
            licenseNumber: medicalLicense.licenseNumber 
          });
          throw new AppError('License number already exists for another doctor', 409);
        }
        // Update both new structure and legacy field
        doctor.licenseNumber = medicalLicense.licenseNumber;
      }
      doctor.medicalLicense.licenseNumber = medicalLicense.licenseNumber;
    }
    if (medicalLicense.documentUrl !== undefined) {
      doctor.medicalLicense.documentUrl = medicalLicense.documentUrl;
    }
    if (medicalLicense.verified !== undefined) {
      doctor.medicalLicense.verified = medicalLicense.verified;
      // Also update legacy licenseVerified for backward compatibility
      doctor.licenseVerified = medicalLicense.verified;
      if (medicalLicense.verified && !doctor.licenseVerifiedAt) {
        doctor.licenseVerifiedAt = new Date();
        doctor.licenseVerifiedBy = data.verifiedBy || doctor.createdBy;
      } else if (!medicalLicense.verified) {
        doctor.licenseVerifiedAt = null;
        doctor.licenseVerifiedBy = null;
      }
    }
  }
  
  if (bio !== undefined) doctor.bio = bio;
  if (experience !== undefined) doctor.experience = experience;
  if (education) doctor.education = education;
  if (certifications) {
    // Handle both issuingOrganization and issuedBy
    doctor.certifications = certifications.map(cert => ({
      name: cert.name,
      issuingOrganization: cert.issuingOrganization || cert.issuedBy,
      issuedBy: cert.issuedBy || cert.issuingOrganization,
      issueDate: cert.issueDate ? new Date(cert.issueDate) : undefined,
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
      year: cert.year
    }));
  }
  if (languages) doctor.languages = languages;
  if (availability) doctor.availability = availability;
  if (address) doctor.address = address;
  
  // Update bank account details
  if (bankAccount !== undefined) {
    doctor.bankAccount = doctor.bankAccount || {};
    if (bankAccount.accountHolderName !== undefined) {
      doctor.bankAccount.accountHolderName = bankAccount.accountHolderName;
    }
    if (bankAccount.bankName !== undefined) {
      doctor.bankAccount.bankName = bankAccount.bankName;
    }
    if (bankAccount.accountNumber !== undefined) {
      doctor.bankAccount.accountNumber = bankAccount.accountNumber;
    }
    if (bankAccount.routingNumber !== undefined) {
      doctor.bankAccount.routingNumber = bankAccount.routingNumber;
    }
    if (bankAccount.accountType !== undefined) {
      doctor.bankAccount.accountType = bankAccount.accountType;
    }
    if (bankAccount.ifscCode !== undefined) {
      doctor.bankAccount.ifscCode = bankAccount.ifscCode;
    }
    if (bankAccount.swiftCode !== undefined) {
      doctor.bankAccount.swiftCode = bankAccount.swiftCode;
    }
    if (bankAccount.verified !== undefined) {
      doctor.bankAccount.verified = bankAccount.verified;
      if (bankAccount.verified && !doctor.bankAccount.verifiedAt) {
        doctor.bankAccount.verifiedAt = new Date();
        doctor.bankAccount.verifiedBy = data.verifiedBy || doctor.createdBy;
      } else if (!bankAccount.verified) {
        doctor.bankAccount.verifiedAt = null;
        doctor.bankAccount.verifiedBy = null;
      }
    }
  }
  
  if (data.isActive !== undefined) {
    doctor.isActive = data.isActive;
    doctor.user.isActive = data.isActive;
    await doctor.user.save();
  }

  await doctor.save();

  logger.info('Doctor updated successfully', {
    doctorId,
    updatedFields: Object.keys(data)
  });

  await doctor.populate('user', 'firstName lastName email phoneNumber countryCode role isActive createdAt gender dateOfBirth');
  await doctor.populate('specialty', 'name description isActive');
  await doctor.populate('createdBy', 'firstName lastName email');
  await doctor.populate('licenseVerifiedBy', 'firstName lastName email');

  return doctor;
};

// Approve doctor (change status to active)
exports.approveDoctor = async (doctorId, adminId) => {
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new AppError('Invalid doctor ID', 400);
  }

  // Find doctor without any filters (including inactive ones, as we want to approve them)
  // Use findById which automatically handles ObjectId conversion
  const doctor = await Doctor.findById(doctorId).populate('user');
  
  if (!doctor) {
    // Check if doctor exists with different query for debugging
    const doctorExists = await Doctor.findOne({ _id: doctorId });
    logger.warn('Doctor approval failed - Doctor not found', { 
      doctorId, 
      adminId,
      doctorExists: !!doctorExists,
      totalDoctors: await Doctor.countDocuments({})
    });
    throw new AppError('Doctor not found', 404);
  }
  
  // Check if user exists
  if (!doctor.user) {
    logger.warn('Doctor approval failed - User not found for doctor', { 
      doctorId, 
      userId: doctor.user?._id || doctor.user 
    });
    throw new AppError('User account not found for this doctor', 404);
  }

  // Update doctor status to active
  doctor.status = 'active';
  doctor.user.isActive = true;
  
  // If license is not verified, verify it during approval
  if (!doctor.licenseVerified) {
    doctor.licenseVerified = true;
    doctor.licenseVerifiedAt = new Date();
    doctor.licenseVerifiedBy = adminId;
  }
  
  await doctor.save();
  await doctor.user.save();

  logger.info('Doctor approved successfully', {
    doctorId: doctor._id,
    userId: doctor.user._id,
    approvedBy: adminId,
    status: doctor.status
  });

  // Populate user data
  await doctor.populate('user', 'firstName lastName email phoneNumber countryCode role isActive isVerified gender dateOfBirth');
  await doctor.populate('specialty', 'name description isActive');
  if (doctor.licenseVerifiedBy) {
    await doctor.populate('licenseVerifiedBy', 'firstName lastName email');
  }

  return doctor;
};

// Delete doctor (soft delete)
exports.deleteDoctor = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId).populate('user');
  if (!doctor) {
    logger.warn('Doctor deletion failed - Doctor not found', { doctorId });
    throw new AppError('Doctor not found', 404);
  }

  // Deactivate doctor and user
  doctor.isActive = false;
  doctor.status = 'suspended';
  doctor.user.isActive = false;
  await doctor.user.save();
  await doctor.save();

  logger.info('Doctor deleted (deactivated)', {
    doctorId,
    userId: doctor.user._id
  });

  return { message: 'Doctor deleted successfully' };
};

// Reset doctor password
exports.resetDoctorPassword = async (doctorId, newPassword) => {
  const doctor = await Doctor.findById(doctorId).populate('user');
  if (!doctor) {
    logger.warn('Password reset failed - Doctor not found', { doctorId });
    throw new AppError('Doctor not found', 404);
  }

  // Update user password (will be hashed by pre-save hook)
  doctor.user.password = newPassword;
  await doctor.user.save();

  logger.info('Doctor password reset successfully', {
    doctorId,
    userId: doctor.user._id
  });

  return { message: 'Password reset successfully' };
};

// Get available specialties (dynamic - fetched from Specialization model)
exports.getAvailableSpecialties = async () => {
  try {
    // Fetch all active specializations from database
    const specializations = await Specialization.find({ isActive: true })
      .select('_id name description')
      .sort({ name: 1 })
      .lean();

    logger.info('Available specialties retrieved dynamically', { 
      count: specializations.length 
    });

    return specializations;
  } catch (err) {
    logger.error('Error retrieving available specialties', {
      error: err.message,
      stack: err.stack
    });
    // Return empty array on error instead of throwing
    return [];
  }
};

