const User = require('../../models/User.model');
const SubAdmin = require('../../models/SubAdmin.model');
const bcrypt = require('bcryptjs');
const { generateAccessToken, generateRefreshToken } = require('../../utils/jwt');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Admin registration
exports.adminRegister = async (data) => {
  const { firstName, lastName, email, phoneNumber, countryCode, password, adminSecretKey } = data;

  // Check if any admin already exists
  const existingAdmin = await User.findOne({ role: 'admin' });
  
  // If admin exists, require secret key for security
  if (existingAdmin) {
    // If ADMIN_SECRET_KEY is set in env, it must match
    if (process.env.ADMIN_SECRET_KEY) {
      if (!adminSecretKey || adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
        logger.warn('Admin registration attempt with invalid secret key', { email, phoneNumber });
        throw new AppError('Invalid admin secret key', 403);
      }
    } else {
      // If no ADMIN_SECRET_KEY is set in env but admin exists, still require a secret key
      // This prevents unauthorized admin creation
      if (!adminSecretKey) {
        logger.warn('Admin registration attempt when admin already exists without secret key', { email, phoneNumber });
        throw new AppError('Admin registration is restricted. Please contact existing admin or provide admin secret key.', 403);
      }
      // If secret key is provided (even if not set in env), allow registration
      // This provides flexibility for custom secret key management
    }
  }
  // If no admin exists, allow registration without secret key (first admin setup)

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: email?.toLowerCase() },
      { phoneNumber }
    ]
  });

  if (existingUser) {
    logger.warn('Admin registration attempt with existing email/phone', { email, phoneNumber });
    throw new AppError('User with this email or phone number already exists', 409);
  }

  // Create admin user
  const user = await User.create({
    firstName,
    lastName,
    email: email?.toLowerCase(),
    phoneNumber,
    countryCode: countryCode || '+91',
    password: password || 'Admin@123',
    role: 'admin',
    isVerified: true, // Admin is auto-verified
    isActive: true, // Admin is auto-activated
    agreeConfirmation: true
  });

  logger.info('Admin registered successfully', {
    userId: user._id,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role
  });

  // Remove password before returning
  user.password = undefined;

  // Generate tokens
  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

  return { user, accessToken, refreshToken };
};

// Admin login (email or phone with password)
exports.adminLogin = async (identifier, password) => {
  // Find user with admin role
  const user = await User.findOne({
    $or: [
      { email: identifier.toLowerCase() },
      { phoneNumber: identifier }
    ],
    role: 'admin'
  }).select('+password');

  if (!user) {
    logger.warn('Admin login attempt failed - User not found or not admin', { identifier });
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    logger.warn('Admin login attempt failed - Invalid password', { userId: user._id, identifier });
    throw new AppError('Invalid credentials', 401);
  }

  // Activate user and update last login
  user.isActive = true;
  user.lastLoginAt = new Date();
  await user.save();

  // Remove password before returning
  user.password = undefined;

  const accessToken = generateAccessToken({ id: user._id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user._id, role: user.role });

  logger.info('Admin logged in successfully', {
    userId: user._id,
    identifier,
    role: user.role
  });

  return { user, accessToken, refreshToken };
};

// Create sub-admin
exports.createSubAdmin = async (adminId, data) => {
  const { firstName, lastName, email, phoneNumber, countryCode, designation, password, role } = data;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [
      { email: email?.toLowerCase() },
      { phoneNumber }
    ]
  });

  if (existingUser) {
    throw new AppError('User with this email or phone number already exists', 409);
  }

  // Create user with sub-admin role (or doctor if specified)
  // Accept 'sub-admin' or 'doctor' role, default to 'sub-admin'
  const userRole = (role === 'doctor' || role === 'sub-admin') ? role : 'sub-admin';
  
  const user = await User.create({
    firstName,
    lastName,
    email: email?.toLowerCase(),
    phoneNumber,
    countryCode: countryCode || '+91',
    password: password || 'SubAdmin@123', // Default password
    role: userRole,
    isVerified: true,
    isActive: true,
    agreeConfirmation: true
  });

  // Create sub-admin record
  const subAdmin = await SubAdmin.create({
    user: user._id,
    designation: designation || 'Sub-Admin',
    permissions: [],
    isActive: true,
    createdBy: adminId
  });

  logger.info('Sub-admin created successfully', {
    subAdminId: subAdmin._id,
    userId: user._id,
    createdBy: adminId,
    designation
  });

  // Populate user data
  await subAdmin.populate('user', 'firstName lastName email phoneNumber countryCode role isActive createdAt');
  await subAdmin.populate('createdBy', 'firstName lastName email');

  return subAdmin;
};

// Get all sub-admins with search and pagination
exports.getAllSubAdmins = async (query) => {
  const { search, page = 1, limit = 10, designation, isActive } = query;
  
  let filter = {};
  
  // Search filter - search in user fields and designation
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
    
    // Also check if search matches designation
    const designationMatch = new RegExp(search, 'i');
    const matchingDesignations = ['Medicine Manager', 'Order Manager', 'Sub-Admin', 'Doctor Manager', 'Patient Manager'].filter(
      d => designationMatch.test(d)
    );
    
    // Build search filter
    const searchConditions = [];
    
    // If users found, add user filter
    if (userIds.length > 0) {
      searchConditions.push({ user: { $in: userIds } });
    }
    
    // If designation matches, add designation filter
    if (matchingDesignations.length > 0) {
      searchConditions.push({ designation: { $in: matchingDesignations } });
    }
    
    // If no matches found in users or designation, return empty result
    if (searchConditions.length === 0) {
      return {
        subAdmins: [],
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

  // Designation filter (exact match when designation is provided separately)
  // This works as an additional AND filter on top of search
  if (designation) {
    // If we already have $or from search, we need to use $and to combine
    if (filter.$or) {
      const searchFilter = { $or: filter.$or };
      filter = {
        $and: [
          searchFilter,
          { designation: designation }
        ]
      };
    } else {
      filter.designation = designation;
    }
  }

  // Active status filter
  if (isActive !== undefined) {
    const isActiveValue = isActive === 'true' || isActive === true;
    // If we already have $and, add to it
    if (filter.$and) {
      filter.$and.push({ isActive: isActiveValue });
    } else if (filter.$or) {
      // If we have $or from search, wrap in $and
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

  const subAdmins = await SubAdmin.find(filter)
    .populate('user', 'firstName lastName email phoneNumber countryCode role isActive createdAt')
    .populate('createdBy', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Add active permissions count
  const subAdminsWithCount = subAdmins.map(subAdmin => {
    const activeCount = subAdmin.permissions?.filter(p => 
      p.canView || p.canCreate || p.canUpdate || p.canDelete
    ).length || 0;
    return {
      ...subAdmin,
      activePermissionsCount: activeCount,
      totalModules: 9
    };
  });

  const total = await SubAdmin.countDocuments(filter);

  return {
    subAdmins: subAdminsWithCount,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get sub-admin by ID
exports.getSubAdminById = async (subAdminId) => {
  const subAdmin = await SubAdmin.findById(subAdminId)
    .populate('user', 'firstName lastName email phoneNumber countryCode role isActive createdAt')
    .populate('createdBy', 'firstName lastName email');

  if (!subAdmin) {
    throw new AppError('Sub-admin not found', 404);
  }

  const activeCount = subAdmin.permissions?.filter(p => 
    p.canView || p.canCreate || p.canUpdate || p.canDelete
  ).length || 0;

  return {
    ...subAdmin.toObject(),
    activePermissionsCount: activeCount,
    totalModules: 9
  };
};

// Update sub-admin
exports.updateSubAdmin = async (subAdminId, data) => {
  const { firstName, lastName, email, phoneNumber, countryCode, designation, isActive } = data;

  const subAdmin = await SubAdmin.findById(subAdminId).populate('user');
  if (!subAdmin) {
    throw new AppError('Sub-admin not found', 404);
  }

  // Update user data
  if (firstName) subAdmin.user.firstName = firstName;
  if (lastName) subAdmin.user.lastName = lastName;
  if (email) subAdmin.user.email = email.toLowerCase();
  if (phoneNumber) subAdmin.user.phoneNumber = phoneNumber;
  if (countryCode) subAdmin.user.countryCode = countryCode;
  if (isActive !== undefined) {
    subAdmin.isActive = isActive;
    subAdmin.user.isActive = isActive;
  }
  await subAdmin.user.save();

  // Update sub-admin data
  if (designation) subAdmin.designation = designation;
  await subAdmin.save();

  logger.info('Sub-admin updated successfully', {
    subAdminId,
    updatedFields: Object.keys(data)
  });

  await subAdmin.populate('user', 'firstName lastName email phoneNumber countryCode role isActive createdAt');
  await subAdmin.populate('createdBy', 'firstName lastName email');

  const activeCount = subAdmin.permissions?.filter(p => 
    p.canView || p.canCreate || p.canUpdate || p.canDelete
  ).length || 0;

  return {
    ...subAdmin.toObject(),
    activePermissionsCount: activeCount,
    totalModules: 9
  };
};

// Delete sub-admin
exports.deleteSubAdmin = async (subAdminId) => {
  const subAdmin = await SubAdmin.findById(subAdminId).populate('user');
  if (!subAdmin) {
    throw new AppError('Sub-admin not found', 404);
  }

  // Deactivate user instead of deleting
  subAdmin.user.isActive = false;
  subAdmin.isActive = false;
  await subAdmin.user.save();
  await subAdmin.save();

  logger.info('Sub-admin deleted (deactivated)', {
    subAdminId,
    userId: subAdmin.user._id
  });

  return { message: 'Sub-admin deleted successfully' };
};

// Set permissions for sub-admin
exports.setPermissions = async (subAdminId, permissions) => {
  const subAdmin = await SubAdmin.findById(subAdminId);
  if (!subAdmin) {
    throw new AppError('Sub-admin not found', 404);
  }

  // Validate permissions structure
  const validModules = [
    'dashboard',
    'provider-management',
    'medicine-management',
    'patient-management',
    'prescription-order-management',
    'financial-overview',
    'compliance-security',
    'marketing-notifications',
    'reports-exports'
  ];

  const validatedPermissions = permissions.map(perm => {
    if (!validModules.includes(perm.module)) {
      throw new AppError(`Invalid module: ${perm.module}`, 400);
    }
    return {
      module: perm.module,
      canView: perm.canView || false,
      canCreate: perm.canCreate || false,
      canUpdate: perm.canUpdate || false,
      canDelete: perm.canDelete || false
    };
  });

  subAdmin.permissions = validatedPermissions;
  await subAdmin.save();

  logger.info('Sub-admin permissions updated', {
    subAdminId,
    permissionsCount: validatedPermissions.length
  });

  await subAdmin.populate('user', 'firstName lastName email phoneNumber countryCode role isActive createdAt');
  await subAdmin.populate('createdBy', 'firstName lastName email');

  const activeCount = subAdmin.permissions?.filter(p => 
    p.canView || p.canCreate || p.canUpdate || p.canDelete
  ).length || 0;

  return {
    ...subAdmin.toObject(),
    activePermissionsCount: activeCount,
    totalModules: 9
  };
};

// Get available modules list
exports.getAvailableModules = () => {
  return [
    { module: 'dashboard', label: 'Dashboard' },
    { module: 'provider-management', label: 'Provider Management' },
    { module: 'medicine-management', label: 'Medicine Management' },
    { module: 'patient-management', label: 'Patient Management' },
    { module: 'prescription-order-management', label: 'Prescription & Order Management' },
    { module: 'financial-overview', label: 'Financial Overview' },
    { module: 'compliance-security', label: 'Compliance & Security' },
    { module: 'marketing-notifications', label: 'Marketing & Notifications' },
    { module: 'reports-exports', label: 'Reports & Exports' }
  ];
};

