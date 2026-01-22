/**
 * Admin Service - Refactored with helpers and optimized
 */

const User = require('../../models/User.model');
const SubAdmin = require('../../models/SubAdmin.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');
const {
  normalizeIdentifier,
  buildIdentifierOrQuery,
  verifyPassword,
  generateTokens,
  activateUser,
  parsePagination,
  buildPaginationResponse
} = require('../../helpers');

// =============================================
// ADMIN REGISTRATION & LOGIN
// =============================================

/**
 * Admin registration
 */
exports.adminRegister = async (data) => {
  const { firstName, lastName, email, phoneNumber, countryCode, password, adminSecretKey } = data;

  // Check if admin already exists (parallel with user check)
  const [existingAdmin, existingUser] = await Promise.all([
    User.exists({ role: 'admin' }),
    User.findOne({
      $or: [
        { email: email?.toLowerCase() },
        { phoneNumber }
      ]
    }).select('_id').lean()
  ]);
  
  // Validate secret key if admin exists
  if (existingAdmin) {
    if (process.env.ADMIN_SECRET_KEY) {
      if (!adminSecretKey || adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
        logger.warn('Admin registration - invalid secret key', { email, phoneNumber });
        throw new AppError('Invalid admin secret key', 403);
      }
    } else if (!adminSecretKey) {
      logger.warn('Admin registration - no secret key provided', { email, phoneNumber });
      throw new AppError('Admin registration is restricted. Please provide admin secret key.', 403);
    }
  }

  if (existingUser) {
    logger.warn('Admin registration - user exists', { email, phoneNumber });
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
    isVerified: true,
    isActive: true,
    agreeConfirmation: true
  });

  logger.info('Admin registered', { userId: user._id, email: user.email, role: user.role });

  user.password = undefined;
  const tokens = generateTokens(user, true);

  return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
};

/**
 * Admin login - OPTIMIZED
 */
exports.adminLogin = async (identifier, password) => {
  // Find admin user with password in single query
  const user = await User.findOne({
    ...buildIdentifierOrQuery(identifier),
    role: 'admin'
  }).select('+password');

  if (!user) {
    logger.warn('Admin login failed - not found', { identifier });
    throw new AppError('Invalid credentials', 401);
  }

  // Verify password
  const isMatch = await verifyPassword(password, user.password);
  if (!isMatch) {
    logger.warn('Admin login failed - invalid password', { userId: user._id });
    throw new AppError('Invalid credentials', 401);
  }

  // Activate and generate tokens in parallel
  const [activatedUser, tokens] = await Promise.all([
    activateUser(user._id),
    Promise.resolve(generateTokens(user, true))
  ]);

  logger.info('Admin logged in', { userId: user._id, role: user.role });

  return { user: activatedUser, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
};

// =============================================
// SUB-ADMIN MANAGEMENT
// =============================================

/**
 * Create sub-admin
 */
exports.createSubAdmin = async (adminId, data) => {
  const { firstName, lastName, email, phoneNumber, countryCode, designation, password, role } = data;

  // Check if user exists
  const existingUser = await User.exists({
    $or: [
      { email: email?.toLowerCase() },
      { phoneNumber }
    ]
  });

  if (existingUser) {
    throw new AppError('User with this email or phone number already exists', 409);
  }

  const userRole = (role === 'doctor' || role === 'sub-admin') ? role : 'sub-admin';
  
  // Create user and sub-admin in parallel
  const user = await User.create({
    firstName,
    lastName,
    email: email?.toLowerCase(),
    phoneNumber,
    countryCode: countryCode || '+91',
    password: password || 'SubAdmin@123',
    role: userRole,
    isVerified: true,
    isActive: true,
    agreeConfirmation: true
  });

  const subAdmin = await SubAdmin.create({
    user: user._id,
    designation: designation || 'Sub-Admin',
    permissions: [],
    isActive: true,
    createdBy: adminId
  });

  logger.info('Sub-admin created', { subAdminId: subAdmin._id, userId: user._id, createdBy: adminId });

  // Populate both in parallel
  await Promise.all([
    subAdmin.populate('user', 'firstName lastName email phoneNumber countryCode role isActive createdAt'),
    subAdmin.populate('createdBy', 'firstName lastName email')
  ]);

  return subAdmin;
};

/**
 * Get all sub-admins with search and pagination - OPTIMIZED
 */
exports.getAllSubAdmins = async (query) => {
  const { search, designation, isActive } = query;
  const { page, limit, skip } = parsePagination(query);
  
  let filter = {};
  
  // Search filter
  if (search) {
    const searchRegex = new RegExp(search, 'i');
    
    // Find matching users
    const matchingUsers = await User.find({
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex }
      ]
    }).select('_id').lean();
    
    const userIds = matchingUsers.map(u => u._id);
    const matchingDesignations = ['Medicine Manager', 'Order Manager', 'Sub-Admin', 'Doctor Manager', 'Patient Manager']
      .filter(d => searchRegex.test(d));
    
    const searchConditions = [];
    if (userIds.length > 0) searchConditions.push({ user: { $in: userIds } });
    if (matchingDesignations.length > 0) searchConditions.push({ designation: { $in: matchingDesignations } });
    
    if (searchConditions.length === 0) {
      return { subAdmins: [], pagination: buildPaginationResponse(0, page, limit) };
    }
    
    filter.$or = searchConditions;
  }

  // Apply additional filters
  if (designation) {
    filter = filter.$or 
      ? { $and: [{ $or: filter.$or }, { designation }] }
      : { ...filter, designation };
  }

  if (isActive !== undefined) {
    const isActiveValue = isActive === 'true' || isActive === true;
    filter = filter.$and 
      ? { $and: [...filter.$and, { isActive: isActiveValue }] }
      : filter.$or 
        ? { $and: [{ $or: filter.$or }, { isActive: isActiveValue }] }
        : { ...filter, isActive: isActiveValue };
  }

  // Run count and find in parallel
  const [total, subAdmins] = await Promise.all([
    SubAdmin.countDocuments(filter),
    SubAdmin.find(filter)
      .populate('user', 'firstName lastName email phoneNumber countryCode role isActive createdAt')
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  // Add permissions count
  const subAdminsWithCount = subAdmins.map(subAdmin => ({
    ...subAdmin,
    activePermissionsCount: subAdmin.permissions?.filter(p => 
      p.canView || p.canCreate || p.canUpdate || p.canDelete
    ).length || 0,
    totalModules: 9
  }));

  return {
    subAdmins: subAdminsWithCount,
    pagination: buildPaginationResponse(total, page, limit)
  };
};

/**
 * Get sub-admin by ID
 */
exports.getSubAdminById = async (subAdminId) => {
  const subAdmin = await SubAdmin.findById(subAdminId)
    .populate('user', 'firstName lastName email phoneNumber countryCode role isActive createdAt')
    .populate('createdBy', 'firstName lastName email');

  if (!subAdmin) throw new AppError('Sub-admin not found', 404);

  return {
    ...subAdmin.toObject(),
    activePermissionsCount: subAdmin.permissions?.filter(p => 
      p.canView || p.canCreate || p.canUpdate || p.canDelete
    ).length || 0,
    totalModules: 9
  };
};

/**
 * Update sub-admin
 */
exports.updateSubAdmin = async (subAdminId, data) => {
  const { firstName, lastName, email, phoneNumber, countryCode, designation, isActive } = data;

  const subAdmin = await SubAdmin.findById(subAdminId).populate('user');
  if (!subAdmin) throw new AppError('Sub-admin not found', 404);

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
  
  // Update sub-admin data
  if (designation) subAdmin.designation = designation;
  
  // Save both in parallel
  await Promise.all([subAdmin.user.save(), subAdmin.save()]);

  logger.info('Sub-admin updated', { subAdminId, updatedFields: Object.keys(data) });

  await Promise.all([
    subAdmin.populate('user', 'firstName lastName email phoneNumber countryCode role isActive createdAt'),
    subAdmin.populate('createdBy', 'firstName lastName email')
  ]);

  return {
    ...subAdmin.toObject(),
    activePermissionsCount: subAdmin.permissions?.filter(p => 
      p.canView || p.canCreate || p.canUpdate || p.canDelete
    ).length || 0,
    totalModules: 9
  };
};

/**
 * Delete sub-admin (soft delete)
 */
exports.deleteSubAdmin = async (subAdminId) => {
  const subAdmin = await SubAdmin.findById(subAdminId).populate('user');
  if (!subAdmin) throw new AppError('Sub-admin not found', 404);

  // Deactivate both in parallel
  subAdmin.user.isActive = false;
  subAdmin.isActive = false;
  
  await Promise.all([subAdmin.user.save(), subAdmin.save()]);

  logger.info('Sub-admin deactivated', { subAdminId, userId: subAdmin.user._id });

  return { message: 'Sub-admin deleted successfully' };
};

/**
 * Set permissions for sub-admin
 */
exports.setPermissions = async (subAdminId, permissions) => {
  const subAdmin = await SubAdmin.findById(subAdminId);
  if (!subAdmin) throw new AppError('Sub-admin not found', 404);

  const validModules = [
    'dashboard', 'provider-management', 'medicine-management', 'patient-management',
    'prescription-order-management', 'financial-overview', 'compliance-security',
    'marketing-notifications', 'reports-exports'
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

  logger.info('Sub-admin permissions updated', { subAdminId, permissionsCount: validatedPermissions.length });

  await Promise.all([
    subAdmin.populate('user', 'firstName lastName email phoneNumber countryCode role isActive createdAt'),
    subAdmin.populate('createdBy', 'firstName lastName email')
  ]);

  return {
    ...subAdmin.toObject(),
    activePermissionsCount: validatedPermissions.filter(p => 
      p.canView || p.canCreate || p.canUpdate || p.canDelete
    ).length,
    totalModules: 9
  };
};

/**
 * Get available modules list
 */
exports.getAvailableModules = () => [
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
