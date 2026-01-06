const ContactFormQuery = require('../../models/ContactFormQuery.model');
const AppError = require('../../utils/AppError');

// Create a new contact form query
exports.createContactFormQuery = async (data, userId = null) => {
  // Handle simple help desk form (firstName + email only)
  if (data.firstName && !data.name) {
    data.name = data.firstName;
  }
  
  // Set default values for optional fields if not provided
  if (!data.phoneNumber) {
    data.phoneNumber = '';
  }
  if (!data.services) {
    data.services = 'Help Desk Inquiry';
  }
  if (!data.message) {
    data.message = 'Contact request from help desk form';
  }
  
  if (userId) {
    data.submittedBy = userId;
  }
  const contactFormQuery = await ContactFormQuery.create(data);
  return contactFormQuery.populate('submittedBy', 'firstName lastName email phoneNumber');
};

// Get all contact form queries with search, filter, and pagination
exports.getAllContactFormQueries = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    services,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query;

  const filter = {};

  // Search filter
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phoneNumber: { $regex: search, $options: 'i' } },
      { message: { $regex: search, $options: 'i' } }
    ];
  }

  // Status filter
  if (status) {
    filter.status = status;
  }

  // Services filter
  if (services) {
    filter.services = { $regex: services, $options: 'i' };
  }

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const contactFormQueries = await ContactFormQuery.find(filter)
    .populate('respondedBy', 'firstName lastName email')
    .populate('submittedBy', 'firstName lastName email phoneNumber')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await ContactFormQuery.countDocuments(filter);

  return {
    data: contactFormQueries,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get contact form query by ID
exports.getContactFormQueryById = async (id) => {
  const contactFormQuery = await ContactFormQuery.findById(id)
    .populate('respondedBy', 'firstName lastName email')
    .populate('submittedBy', 'firstName lastName email phoneNumber')
    .lean();

  if (!contactFormQuery) {
    throw new AppError('Contact form query not found', 404);
  }

  return contactFormQuery;
};

// Update contact form query
exports.updateContactFormQuery = async (id, data, userId = null) => {
  const contactFormQuery = await ContactFormQuery.findById(id);

  if (!contactFormQuery) {
    throw new AppError('Contact form query not found', 404);
  }

  // If status is being updated to resolved, set respondedAt and respondedBy
  if (data.status === 'resolved' && !contactFormQuery.respondedAt) {
    data.respondedAt = new Date();
    if (userId) {
      data.respondedBy = userId;
    }
  }

  Object.assign(contactFormQuery, data);
  await contactFormQuery.save();

  return contactFormQuery.populate('respondedBy', 'firstName lastName email');
};

// Delete contact form query
exports.deleteContactFormQuery = async (id) => {
  const contactFormQuery = await ContactFormQuery.findByIdAndDelete(id);

  if (!contactFormQuery) {
    throw new AppError('Contact form query not found', 404);
  }

  return contactFormQuery;
};

// Get statistics
exports.getContactFormQueryStatistics = async () => {
  const total = await ContactFormQuery.countDocuments();
  const pending = await ContactFormQuery.countDocuments({ status: 'pending' });
  const inProgress = await ContactFormQuery.countDocuments({ status: 'in_progress' });
  const resolved = await ContactFormQuery.countDocuments({ status: 'resolved' });
  const archived = await ContactFormQuery.countDocuments({ status: 'archived' });

  // Get queries by date range (last 7 days, last 30 days)
  const now = new Date();
  const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const last7DaysCount = await ContactFormQuery.countDocuments({
    createdAt: { $gte: last7Days }
  });

  const last30DaysCount = await ContactFormQuery.countDocuments({
    createdAt: { $gte: last30Days }
  });

  return {
    total,
    pending,
    inProgress,
    resolved,
    archived,
    last7Days: last7DaysCount,
    last30Days: last30DaysCount
  };
};

