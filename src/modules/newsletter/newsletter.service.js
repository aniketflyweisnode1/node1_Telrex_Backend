const Newsletter = require('../../models/Newsletter.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Subscribe to newsletter
exports.subscribeNewsletter = async (data, req = null) => {
  const { email } = data;

  // Check if email already exists
  const existingSubscription = await Newsletter.findOne({ email: email.toLowerCase() });

  if (existingSubscription) {
    // If already subscribed, return existing subscription
    if (existingSubscription.status === 'subscribed') {
      return existingSubscription;
    }
    
    // If unsubscribed, resubscribe
    existingSubscription.status = 'subscribed';
    existingSubscription.subscribedAt = new Date();
    existingSubscription.unsubscribedAt = undefined;
    if (req) {
      existingSubscription.ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      existingSubscription.userAgent = req.headers['user-agent'];
    }
    await existingSubscription.save();
    
    logger.info('Newsletter resubscription', {
      email: existingSubscription.email
    });
    
    return existingSubscription;
  }

  // Create new subscription
  const subscriptionData = {
    email: email.toLowerCase(),
    status: 'subscribed',
    subscribedAt: new Date()
  };

  if (req) {
    subscriptionData.ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    subscriptionData.userAgent = req.headers['user-agent'];
    subscriptionData.source = req.headers['x-source'] || 'website';
  }

  const newsletter = await Newsletter.create(subscriptionData);

  logger.info('Newsletter subscription created', {
    email: newsletter.email,
    source: newsletter.source
  });

  return newsletter;
};

// Unsubscribe from newsletter
exports.unsubscribeNewsletter = async (email) => {
  const subscription = await Newsletter.findOne({ email: email.toLowerCase() });

  if (!subscription) {
    throw new AppError('Email not found in newsletter subscriptions', 404);
  }

  if (subscription.status === 'unsubscribed') {
    return subscription;
  }

  subscription.status = 'unsubscribed';
  subscription.unsubscribedAt = new Date();
  await subscription.save();

  logger.info('Newsletter unsubscription', {
    email: subscription.email
  });

  return subscription;
};

// Get all newsletter subscriptions (admin)
exports.getAllNewsletterSubscriptions = async (query = {}) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
    sortBy = 'subscribedAt',
    sortOrder = 'desc'
  } = query;

  const filter = {};

  // Search filter
  if (search) {
    filter.email = { $regex: search, $options: 'i' };
  }

  // Status filter
  if (status) {
    filter.status = status;
  }

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const subscriptions = await Newsletter.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Newsletter.countDocuments(filter);

  return {
    subscriptions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get newsletter statistics (admin)
exports.getNewsletterStatistics = async () => {
  const total = await Newsletter.countDocuments();
  const subscribed = await Newsletter.countDocuments({ status: 'subscribed' });
  const unsubscribed = await Newsletter.countDocuments({ status: 'unsubscribed' });
  const pending = await Newsletter.countDocuments({ status: 'pending' });

  // Get subscriptions by date (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentSubscriptions = await Newsletter.countDocuments({
    subscribedAt: { $gte: thirtyDaysAgo },
    status: 'subscribed'
  });

  return {
    total,
    subscribed,
    unsubscribed,
    pending,
    recentSubscriptions
  };
};

// Delete newsletter subscription (admin)
exports.deleteNewsletterSubscription = async (subscriptionId) => {
  const subscription = await Newsletter.findById(subscriptionId);

  if (!subscription) {
    throw new AppError('Newsletter subscription not found', 404);
  }

  await Newsletter.findByIdAndDelete(subscriptionId);

  logger.info('Newsletter subscription deleted', {
    email: subscription.email,
    subscriptionId: subscriptionId
  });

  return { message: 'Newsletter subscription deleted successfully' };
};

