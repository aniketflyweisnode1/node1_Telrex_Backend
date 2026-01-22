/**
 * Doctor Helper - Shared utilities for doctor-related operations
 * Eliminates code duplication across doctor panel and admin services
 */

const Doctor = require('../models/Doctor.model');
const User = require('../models/User.model');
const Specialization = require('../models/Specialization.model');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// ============ POPULATE OPTIONS ============

const DOCTOR_USER_POPULATE = {
  path: 'user',
  select: 'firstName lastName email phoneNumber countryCode role isActive createdAt gender dateOfBirth profilePicture'
};

const DOCTOR_SPECIALTY_POPULATE = {
  path: 'specialty',
  select: 'name description isActive',
  match: { isActive: true }
};

const DOCTOR_CREATED_BY_POPULATE = {
  path: 'createdBy',
  select: 'firstName lastName email'
};

const DOCTOR_LICENSE_VERIFIED_BY_POPULATE = {
  path: 'licenseVerifiedBy',
  select: 'firstName lastName email'
};

const DOCTOR_FULL_POPULATE = [
  DOCTOR_USER_POPULATE,
  DOCTOR_SPECIALTY_POPULATE,
  DOCTOR_CREATED_BY_POPULATE,
  DOCTOR_LICENSE_VERIFIED_BY_POPULATE
];

// ============ VALIDATION HELPERS ============

/**
 * Validate ObjectId and throw if invalid
 * @param {string} id - ID to validate
 * @param {string} fieldName - Field name for error message
 */
const ensureValidObjectId = (id, fieldName = 'ID') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName} format`, 400);
  }
};

/**
 * Ensure ObjectId type for doctor ID
 * @param {string|ObjectId} doctorId - Doctor ID
 * @returns {ObjectId} MongoDB ObjectId
 */
const ensureObjectId = (doctorId) => {
  return doctorId instanceof mongoose.Types.ObjectId
    ? doctorId
    : new mongoose.Types.ObjectId(doctorId.toString());
};

/**
 * Validate and get specialization
 * @param {string} specialtyIdOrName - Specialty ID or name
 * @returns {Object|null} Specialization or null
 */
const validateSpecialization = async (specialtyIdOrName) => {
  if (!specialtyIdOrName) return null;
  
  let specialization = null;
  
  if (mongoose.Types.ObjectId.isValid(specialtyIdOrName)) {
    specialization = await Specialization.findById(specialtyIdOrName).lean();
  } else {
    specialization = await Specialization.findOne({
      name: { $regex: new RegExp(`^${specialtyIdOrName}$`, 'i') },
      isActive: true
    }).lean();
  }
  
  return specialization;
};

/**
 * Ensure specialization exists and is active
 * @param {string} specialtyId - Specialty ID
 * @returns {Object} Specialization document
 */
const ensureValidSpecialization = async (specialtyId) => {
  ensureValidObjectId(specialtyId, 'specialization ID');
  
  const specialization = await Specialization.findById(specialtyId);
  if (!specialization) {
    throw new AppError('Specialization not found', 404);
  }
  if (!specialization.isActive) {
    throw new AppError('Cannot assign inactive specialization to doctor', 400);
  }
  
  return specialization;
};

// ============ DOCTOR LOOKUP HELPERS ============

/**
 * Get or find doctor profile from userId
 * @param {string} userId - User ID
 * @param {Object} options - { lean: true, populate: false, strict: true }
 * @returns {Object} Doctor document
 */
const getDoctor = async (userId, options = {}) => {
  const { lean = false, populate = false, strict = true } = options;
  
  let query = Doctor.findOne({ user: userId });
  
  if (populate) {
    query = query
      .populate('user', 'firstName lastName email phoneNumber countryCode')
      .populate('specialty', 'name description');
  }
  
  if (lean) {
    query = query.lean();
  }
  
  const doctor = await query;
  
  if (!doctor && strict) {
    throw new AppError('Doctor profile not found. Please contact an administrator to create your doctor profile.', 404);
  }
  
  return doctor;
};

/**
 * Get doctor by ID (for admin operations)
 * @param {string} doctorId - Doctor ID
 * @param {Object} options - { lean: true, populate: false }
 * @returns {Object} Doctor document
 */
const getDoctorById = async (doctorId, options = {}) => {
  const { lean = false, populate = false, populateUser = false } = options;
  
  ensureValidObjectId(doctorId, 'doctor ID');
  
  let query = Doctor.findById(doctorId);
  
  if (populate || populateUser) {
    query = query
      .populate(DOCTOR_USER_POPULATE)
      .populate(DOCTOR_SPECIALTY_POPULATE)
      .populate(DOCTOR_CREATED_BY_POPULATE)
      .populate(DOCTOR_LICENSE_VERIFIED_BY_POPULATE);
  }
  
  if (lean) {
    query = query.lean();
  }
  
  const doctor = await query;
  
  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }
  
  return doctor;
};

// ============ FILTER HELPERS ============

/**
 * Build filter for doctor queries
 * @param {Object} query - Request query params
 * @returns {Object} MongoDB filter
 */
const buildDoctorFilter = async (query = {}) => {
  const { search, specialty, status, licenseVerified, isActive } = query;
  let filter = {};
  
  // Search filter
  if (search) {
    const userSearchFilter = {
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ]
    };
    
    const matchingUsers = await User.find(userSearchFilter).select('_id').lean();
    const userIds = matchingUsers.map(u => u._id);
    
    // Find matching specializations
    let specializationIds = [];
    try {
      const matchingSpecs = await Specialization.find({
        name: { $regex: search, $options: 'i' },
        isActive: true
      }).select('_id').lean();
      specializationIds = matchingSpecs.map(s => s._id);
    } catch (err) {
      logger.warn('Error searching specializations', { error: err.message });
    }
    
    const searchConditions = [];
    if (userIds.length > 0) {
      searchConditions.push({ user: { $in: userIds } });
    }
    if (specializationIds.length > 0) {
      searchConditions.push({ specialty: { $in: specializationIds } });
    }
    searchConditions.push({ licenseNumber: { $regex: search, $options: 'i' } });
    
    if (searchConditions.length > 0) {
      filter.$or = searchConditions;
    }
  }
  
  // Specialty filter
  if (specialty) {
    const specialization = await validateSpecialization(specialty);
    if (!specialization || !specialization.isActive) {
      return { _noResults: true }; // Signal no results
    }
    filter = addConditionToFilter(filter, { specialty: specialization._id });
  }
  
  // Status filter
  if (status) {
    filter = addConditionToFilter(filter, { status });
  }
  
  // License verified filter
  if (licenseVerified !== undefined) {
    const isVerified = licenseVerified === 'true' || licenseVerified === true;
    filter = addConditionToFilter(filter, { licenseVerified: isVerified });
  }
  
  // Active filter
  if (isActive !== undefined) {
    const isActiveValue = isActive === 'true' || isActive === true;
    filter = addConditionToFilter(filter, { isActive: isActiveValue });
  }
  
  return filter;
};

/**
 * Add condition to existing filter handling $or and $and
 * @param {Object} filter - Existing filter
 * @param {Object} condition - New condition to add
 * @returns {Object} Updated filter
 */
const addConditionToFilter = (filter, condition) => {
  if (filter.$and) {
    filter.$and.push(condition);
  } else if (filter.$or) {
    filter = {
      $and: [
        { $or: filter.$or },
        condition
      ]
    };
    delete filter.$or;
  } else {
    Object.assign(filter, condition);
  }
  return filter;
};

/**
 * Build filter for public doctor queries
 * @param {Object} query - Request query params
 * @param {string} specialtyId - Specialty ID
 * @returns {Object} MongoDB filter
 */
const buildPublicDoctorFilter = (query = {}, specialtyId = null) => {
  const { status, minRating, maxRating } = query;
  
  const filter = {
    isActive: true,
    status: 'active'
  };
  
  if (specialtyId) {
    filter.specialty = specialtyId;
  }
  
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
  
  return filter;
};

// ============ SORT HELPERS ============

/**
 * Build sort options for doctor queries
 * @param {Object} query - Request query params
 * @returns {Object} MongoDB sort
 */
const buildDoctorSort = (query = {}) => {
  const { sortBy = 'createdAt', sortOrder = 'desc' } = query;
  
  const sort = {};
  if (sortBy === 'rating') {
    sort['rating.average'] = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'consultationFee') {
    sort.consultationFee = sortOrder === 'asc' ? 1 : -1;
  } else if (sortBy === 'experience') {
    sort.experience = sortOrder === 'asc' ? 1 : -1;
  } else {
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  }
  
  return sort;
};

// ============ PAGINATION HELPERS ============

/**
 * Parse pagination from query
 * @param {Object} query - Request query
 * @param {Object} defaults - Default values
 * @returns {Object} { page, limit, skip }
 */
const parsePagination = (query = {}, defaults = { page: 1, limit: 10 }) => {
  const page = Math.max(1, parseInt(query.page) || defaults.page);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || defaults.limit));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

/**
 * Build pagination response
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const buildPaginationResponse = (total, page, limit) => {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
};

// ============ DUPLICATE CHECK HELPERS ============

/**
 * Check for duplicate email/phone
 * @param {string} email - Email
 * @param {string} phoneNumber - Phone number
 * @param {string} excludeUserId - User ID to exclude
 */
const checkDuplicateUser = async (email, phoneNumber, excludeUserId = null) => {
  const conditions = [];
  if (email) conditions.push({ email: email.toLowerCase() });
  if (phoneNumber) conditions.push({ phoneNumber });
  
  if (conditions.length === 0) return;
  
  const filter = { $or: conditions };
  if (excludeUserId) {
    filter._id = { $ne: excludeUserId };
  }
  
  const existingUser = await User.findOne(filter);
  if (existingUser) {
    throw new AppError('User with this email or phone number already exists', 409);
  }
};

/**
 * Check for duplicate license number
 * @param {string} licenseNumber - License number
 * @param {string} excludeDoctorId - Doctor ID to exclude
 */
const checkDuplicateLicense = async (licenseNumber, excludeDoctorId = null) => {
  if (!licenseNumber) return;
  
  const filter = { licenseNumber };
  if (excludeDoctorId) {
    filter._id = { $ne: excludeDoctorId };
  }
  
  const existingDoctor = await Doctor.findOne(filter);
  if (existingDoctor) {
    throw new AppError('Doctor with this license number already exists', 409);
  }
};

// ============ DATE RANGE HELPERS ============

/**
 * Get date range based on period string
 * @param {string} period - Period string
 * @returns {Object} { startDate, endDate, dateFilter }
 */
const getDateRange = (period = 'all') => {
  const now = new Date();
  let startDate = null;
  let endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  switch (period) {
    case 'daily':
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
    case 'last_7_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      break;
    case 'last_30_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'all':
    default:
      return { startDate: null, endDate: null, dateFilter: {} };
  }

  const dateFilter = startDate && endDate 
    ? { $gte: startDate, $lte: endDate }
    : startDate ? { $gte: startDate } : {};

  return { startDate, endDate, dateFilter };
};

/**
 * Get previous period date range for comparison
 * @param {string} period - Period string
 * @returns {Object} { previousPeriodStart, previousPeriodEnd, previousDateFilter }
 */
const getPreviousPeriodRange = (period) => {
  const now = new Date();
  let previousPeriodStart = null;
  let previousPeriodEnd = null;

  switch (period) {
    case 'daily':
    case 'today':
      previousPeriodEnd = new Date(now);
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
      previousPeriodEnd.setHours(23, 59, 59, 999);
      previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
    case 'last_7_days':
      previousPeriodEnd = new Date(now);
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 7);
      previousPeriodEnd.setHours(23, 59, 59, 999);
      previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
      previousPeriodStart.setHours(0, 0, 0, 0);
      break;
    case 'monthly':
    case 'this_month':
      previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousPeriodStart.setHours(0, 0, 0, 0);
      previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case 'last_30_days':
      previousPeriodEnd = new Date(now);
      previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 30);
      previousPeriodEnd.setHours(23, 59, 59, 999);
      previousPeriodStart = new Date(previousPeriodEnd);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);
      previousPeriodStart.setHours(0, 0, 0, 0);
      break;
    case 'last_month':
      previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      previousPeriodStart.setHours(0, 0, 0, 0);
      previousPeriodEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59);
      break;
    default:
      return { previousPeriodStart: null, previousPeriodEnd: null, previousDateFilter: {} };
  }

  const previousDateFilter = previousPeriodStart && previousPeriodEnd
    ? { $gte: previousPeriodStart, $lte: previousPeriodEnd }
    : {};

  return { previousPeriodStart, previousPeriodEnd, previousDateFilter };
};

// ============ STATISTICS HELPERS ============

/**
 * Calculate percentage change between two values
 * @param {number} current - Current value
 * @param {number} previous - Previous value
 * @returns {number} Percentage change
 */
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

/**
 * Format percentage change for display
 * @param {number} change - Percentage change value
 * @returns {Object} { formatted, trend }
 */
const formatPercentageChange = (change) => {
  const formatted = change > 0 
    ? `+${change.toFixed(1)}%` 
    : change < 0 
      ? `${change.toFixed(1)}%` 
      : '0%';
  const trend = change >= 0 ? 'up' : 'down';
  return { formatted, trend };
};

/**
 * Format currency for display
 * @param {number} amount - Amount
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount, currency = 'USD') => {
  const value = amount || 0;
  return `$${value.toLocaleString('en-US', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })}`;
};

// ============ FORMAT HELPERS ============

/**
 * Get doctor's full name
 * @param {Object} doctor - Doctor document with populated user
 * @returns {string} Full name
 */
const getDoctorFullName = (doctor) => {
  if (doctor.user?.firstName && doctor.user?.lastName) {
    return `${doctor.user.firstName} ${doctor.user.lastName}`;
  }
  return doctor.user?.email || 'Unknown';
};

/**
 * Get doctor's display name (with Dr. prefix)
 * @param {Object} doctor - Doctor document with populated user
 * @returns {string} Display name
 */
const getDoctorDisplayName = (doctor) => {
  if (doctor.user?.firstName && doctor.user?.lastName) {
    return `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`;
  }
  return doctor.user?.email || 'Unknown';
};

/**
 * Format doctor info for API response
 * @param {Object} doctor - Doctor document
 * @returns {Object} Formatted doctor info
 */
const formatDoctorInfo = (doctor) => {
  return {
    _id: doctor._id,
    doctorId: doctor._id.toString(),
    name: getDoctorFullName(doctor),
    displayName: getDoctorDisplayName(doctor),
    firstName: doctor.user?.firstName || '',
    lastName: doctor.user?.lastName || '',
    email: doctor.user?.email || '',
    phoneNumber: doctor.user?.phoneNumber || '',
    countryCode: doctor.user?.countryCode || '',
    profilePicture: doctor.user?.profilePicture || doctor.profilePicture || null,
    specialty: doctor.specialty ? {
      _id: doctor.specialty._id?.toString() || null,
      name: doctor.specialty.name || 'N/A',
      description: doctor.specialty.description || null
    } : null,
    consultationFee: doctor.consultationFee || 0,
    status: doctor.status || 'pending',
    rating: doctor.rating || { average: 0, totalRatings: 0 },
    experience: doctor.experience || 0
  };
};

/**
 * Format bank account for display
 * @param {Object} bankAccount - Bank account object
 * @param {Object} user - User object
 * @param {boolean} showFull - Show full numbers
 * @returns {Object|null} Formatted bank account
 */
const formatBankAccount = (bankAccount, user = null, showFull = false) => {
  if (!bankAccount || !bankAccount.accountNumber) return null;
  
  const accountHolder = bankAccount.accountHolderName || bankAccount.accountHolder || 
    (user ? `${user.firstName} ${user.lastName}` : 'Unknown');
  
  return {
    accountHolder: accountHolder,
    accountHolderName: accountHolder,
    bankName: bankAccount.bankName || '',
    accountNumber: showFull ? bankAccount.accountNumber : 
      (bankAccount.accountNumber ? `****${bankAccount.accountNumber.slice(-4)}` : null),
    fullAccountNumber: showFull ? bankAccount.accountNumber : null,
    routingNumber: bankAccount.routingNumber || bankAccount.ifscCode || '',
    maskedRoutingNumber: bankAccount.routingNumber ? `****${bankAccount.routingNumber.slice(-4)}` : null,
    fullRoutingNumber: showFull ? bankAccount.routingNumber : null,
    accountType: bankAccount.accountType || 'checking',
    ifscCode: bankAccount.ifscCode || null,
    swiftCode: bankAccount.swiftCode || null,
    verified: bankAccount.verified || false,
    verifiedAt: bankAccount.verifiedAt || null,
    verifiedBy: bankAccount.verifiedBy || null
  };
};

/**
 * Format consultation from intake form
 * @param {Object} intakeForm - Intake form document
 * @returns {Object} Formatted consultation
 */
const formatConsultation = (intakeForm) => {
  const patient = intakeForm.patient?.user;
  const patientName = patient 
    ? `${patient.firstName || ''} ${patient.lastName || ''}`.trim() 
    : intakeForm.basicInformation?.firstName && intakeForm.basicInformation?.lastName
      ? `${intakeForm.basicInformation.firstName} ${intakeForm.basicInformation.lastName}`.trim()
      : 'Unknown Patient';
  
  // Calculate age
  let age = null;
  const dateOfBirth = intakeForm.patient?.dateOfBirth || intakeForm.basicInformation?.dateOfBirth;
  if (dateOfBirth) {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
  }

  const condition = intakeForm.medicalQuestions?.pastMedicalHistory?.join(', ') || 
                   intakeForm.medicalQuestions?.currentMedications?.join(', ') || 
                   'Not specified';
  
  const symptoms = intakeForm.medicalQuestions?.pastMedicalHistory?.slice(0, 2).join(', ') || 
                  'No symptoms listed';

  const submittedDate = new Date(intakeForm.createdAt);
  const formattedDate = submittedDate.toLocaleDateString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const formattedTime = submittedDate.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true
  });

  return {
    id: intakeForm._id,
    patient: {
      id: intakeForm.patient?._id,
      name: patientName,
      age: age,
      gender: intakeForm.patient?.gender || intakeForm.basicInformation?.sex || 'Not specified',
      email: patient?.email || intakeForm.basicInformation?.email,
      phone: patient?.phoneNumber || intakeForm.basicInformation?.phone,
      countryCode: patient?.countryCode || '+91',
      profilePicture: patient?.profilePicture || null
    },
    condition: condition,
    symptoms: symptoms,
    status: intakeForm.status === 'submitted' ? 'pending' : intakeForm.status,
    submittedAt: `${formattedDate} ${formattedTime}`,
    submittedDate: intakeForm.createdAt,
    intakeForm: {
      basicInfoComplete: intakeForm.basicInformation?.isBasicInfoComplete || false,
      emergencyContactComplete: intakeForm.emergencyContact?.isEmergencyContactComplete || false,
      medicalQuestionsComplete: intakeForm.medicalQuestions?.isMedicalQuestionsComplete || false
    }
  };
};

// ============ DATA BUILDING HELPERS ============

/**
 * Build doctor data for creation
 * @param {Object} data - Request data
 * @param {string} userId - User ID
 * @param {string} adminId - Admin ID (creator)
 * @returns {Object} Doctor data
 */
const buildDoctorData = (data, userId, adminId = null) => {
  const doctorData = {
    user: userId,
    specialty: data.specialty,
    licenseNumber: data.licenseNumber,
    licenseVerified: data.licenseVerified || false,
    consultationFee: data.consultationFee || 0,
    status: data.status || 'pending',
    createdBy: adminId || userId,
    isActive: data.status === 'active' || false
  };
  
  // Optional fields
  if (data.experience !== undefined) doctorData.experience = data.experience;
  if (data.education) doctorData.education = data.education;
  if (data.languages) doctorData.languages = data.languages;
  if (data.availability) doctorData.availability = data.availability;
  if (data.address) doctorData.address = data.address;
  if (data.profilePicture) doctorData.profilePicture = data.profilePicture;
  if (data.bio) doctorData.bio = data.bio;
  
  // Handle certifications with issuingOrganization/issuedBy
  if (data.certifications) {
    doctorData.certifications = data.certifications.map(cert => ({
      name: cert.name,
      issuingOrganization: cert.issuingOrganization || cert.issuedBy,
      issuedBy: cert.issuedBy || cert.issuingOrganization,
      issueDate: cert.issueDate ? new Date(cert.issueDate) : undefined,
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
      year: cert.year
    }));
  }
  
  return doctorData;
};

/**
 * Build user data for doctor creation
 * @param {Object} data - Request data
 * @returns {Object} User data
 */
const buildDoctorUserData = (data) => {
  return {
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email?.toLowerCase(),
    phoneNumber: data.phoneNumber,
    countryCode: data.countryCode || '+91',
    password: data.password || 'Doctor@123',
    role: 'doctor',
    isVerified: data.licenseVerified || false,
    isActive: data.status === 'active',
    agreeConfirmation: data.agreeConfirmation || true,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined
  };
};

/**
 * Apply updates to doctor and user
 * @param {Object} doctor - Doctor document
 * @param {Object} data - Update data
 */
const applyDoctorUpdates = async (doctor, data) => {
  // Update user data
  const user = doctor.user;
  if (data.firstName) user.firstName = data.firstName;
  if (data.lastName) user.lastName = data.lastName;
  if (data.gender !== undefined) user.gender = data.gender;
  if (data.dateOfBirth !== undefined) {
    user.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
  }
  if (data.countryCode) user.countryCode = data.countryCode;
  
  // Email update with uniqueness check
  if (data.email && data.email.toLowerCase() !== user.email) {
    await checkDuplicateUser(data.email, null, user._id);
    user.email = data.email.toLowerCase();
  }
  
  // Phone update with uniqueness check
  if (data.phoneNumber && data.phoneNumber !== user.phoneNumber) {
    await checkDuplicateUser(null, data.phoneNumber, user._id);
    user.phoneNumber = data.phoneNumber;
  }
  
  // Update doctor data
  if (data.specialty) doctor.specialty = data.specialty;
  if (data.consultationFee !== undefined) doctor.consultationFee = data.consultationFee;
  if (data.bio !== undefined) doctor.bio = data.bio;
  if (data.experience !== undefined) doctor.experience = data.experience;
  if (data.education) doctor.education = data.education;
  if (data.languages) doctor.languages = data.languages;
  if (data.availability) doctor.availability = data.availability;
  if (data.address) doctor.address = data.address;
  if (data.profilePicture !== undefined) doctor.profilePicture = data.profilePicture;
  
  // License update
  if (data.licenseNumber) {
    await checkDuplicateLicense(data.licenseNumber, doctor._id);
    doctor.licenseNumber = data.licenseNumber;
  }
  
  // License verification
  if (data.licenseVerified !== undefined) {
    doctor.licenseVerified = data.licenseVerified;
    if (data.licenseVerified && !doctor.licenseVerifiedAt) {
      doctor.licenseVerifiedAt = new Date();
      doctor.licenseVerifiedBy = data.verifiedBy || doctor.createdBy;
    } else if (!data.licenseVerified) {
      doctor.licenseVerifiedAt = null;
      doctor.licenseVerifiedBy = null;
    }
  }
  
  // Status update
  if (data.status) {
    doctor.status = data.status;
    user.isActive = data.status === 'active';
  }
  
  // isActive update
  if (data.isActive !== undefined) {
    doctor.isActive = data.isActive;
    user.isActive = data.isActive;
  }
  
  // Update certifications
  if (data.certifications) {
    doctor.certifications = data.certifications.map(cert => ({
      name: cert.name,
      issuingOrganization: cert.issuingOrganization || cert.issuedBy,
      issuedBy: cert.issuedBy || cert.issuingOrganization,
      issueDate: cert.issueDate ? new Date(cert.issueDate) : undefined,
      expiryDate: cert.expiryDate ? new Date(cert.expiryDate) : undefined,
      year: cert.year
    }));
  }
  
  // Profile image
  if (data.profileImage) {
    doctor.profileImage = doctor.profileImage || {};
    if (data.profileImage.url !== undefined) doctor.profileImage.url = data.profileImage.url;
    if (data.profileImage.verified !== undefined) doctor.profileImage.verified = data.profileImage.verified;
    if (data.profileImage.url) doctor.profilePicture = data.profileImage.url;
  }
  
  // Medical license
  if (data.medicalLicense) {
    doctor.medicalLicense = doctor.medicalLicense || {};
    if (data.medicalLicense.licenseNumber !== undefined) {
      if (data.medicalLicense.licenseNumber !== doctor.licenseNumber) {
        await checkDuplicateLicense(data.medicalLicense.licenseNumber, doctor._id);
        doctor.licenseNumber = data.medicalLicense.licenseNumber;
      }
      doctor.medicalLicense.licenseNumber = data.medicalLicense.licenseNumber;
    }
    if (data.medicalLicense.documentUrl !== undefined) doctor.medicalLicense.documentUrl = data.medicalLicense.documentUrl;
    if (data.medicalLicense.verified !== undefined) {
      doctor.medicalLicense.verified = data.medicalLicense.verified;
      doctor.licenseVerified = data.medicalLicense.verified;
      if (data.medicalLicense.verified && !doctor.licenseVerifiedAt) {
        doctor.licenseVerifiedAt = new Date();
        doctor.licenseVerifiedBy = data.verifiedBy || doctor.createdBy;
      } else if (!data.medicalLicense.verified) {
        doctor.licenseVerifiedAt = null;
        doctor.licenseVerifiedBy = null;
      }
    }
  }
  
  // Bank account
  if (data.bankAccount) {
    doctor.bankAccount = doctor.bankAccount || {};
    const ba = data.bankAccount;
    if (ba.accountHolderName !== undefined) doctor.bankAccount.accountHolderName = ba.accountHolderName;
    if (ba.bankName !== undefined) doctor.bankAccount.bankName = ba.bankName;
    if (ba.accountNumber !== undefined) doctor.bankAccount.accountNumber = ba.accountNumber;
    if (ba.routingNumber !== undefined) doctor.bankAccount.routingNumber = ba.routingNumber;
    if (ba.accountType !== undefined) doctor.bankAccount.accountType = ba.accountType;
    if (ba.ifscCode !== undefined) doctor.bankAccount.ifscCode = ba.ifscCode;
    if (ba.swiftCode !== undefined) doctor.bankAccount.swiftCode = ba.swiftCode;
    if (ba.verified !== undefined) {
      doctor.bankAccount.verified = ba.verified;
      if (ba.verified && !doctor.bankAccount.verifiedAt) {
        doctor.bankAccount.verifiedAt = new Date();
        doctor.bankAccount.verifiedBy = data.verifiedBy || doctor.createdBy;
      } else if (!ba.verified) {
        doctor.bankAccount.verifiedAt = null;
        doctor.bankAccount.verifiedBy = null;
      }
    }
  }
  
  // Save user
  await user.save();
};

module.exports = {
  // Populate options
  DOCTOR_USER_POPULATE,
  DOCTOR_SPECIALTY_POPULATE,
  DOCTOR_CREATED_BY_POPULATE,
  DOCTOR_LICENSE_VERIFIED_BY_POPULATE,
  DOCTOR_FULL_POPULATE,
  
  // Validation
  ensureValidObjectId,
  ensureObjectId,
  validateSpecialization,
  ensureValidSpecialization,
  
  // Lookup
  getDoctor,
  getDoctorById,
  
  // Filters
  buildDoctorFilter,
  addConditionToFilter,
  buildPublicDoctorFilter,
  
  // Sorting
  buildDoctorSort,
  
  // Pagination
  parsePagination,
  buildPaginationResponse,
  
  // Duplicate checks
  checkDuplicateUser,
  checkDuplicateLicense,
  
  // Date range
  getDateRange,
  getPreviousPeriodRange,
  
  // Statistics
  calculatePercentageChange,
  formatPercentageChange,
  formatCurrency,
  
  // Formatting
  getDoctorFullName,
  getDoctorDisplayName,
  formatDoctorInfo,
  formatBankAccount,
  formatConsultation,
  
  // Data building
  buildDoctorData,
  buildDoctorUserData,
  applyDoctorUpdates
};
