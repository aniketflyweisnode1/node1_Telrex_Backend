const newsletterService = require('./newsletter.service');

// Subscribe to newsletter
exports.subscribeNewsletter = async (req, res, next) => {
  try {
    const subscription = await newsletterService.subscribeNewsletter(req.body, req);
    res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: subscription
    });
  } catch (err) {
    next(err);
  }
};

// Unsubscribe from newsletter
exports.unsubscribeNewsletter = async (req, res, next) => {
  try {
    const subscription = await newsletterService.unsubscribeNewsletter(req.body.email);
    res.status(200).json({
      success: true,
      message: 'Successfully unsubscribed from newsletter',
      data: subscription
    });
  } catch (err) {
    next(err);
  }
};

// Get all newsletter subscriptions (admin)
exports.getAllNewsletterSubscriptions = async (req, res, next) => {
  try {
    const result = await newsletterService.getAllNewsletterSubscriptions(req.query);
    res.status(200).json({
      success: true,
      data: result.subscriptions,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get newsletter statistics (admin)
exports.getNewsletterStatistics = async (req, res, next) => {
  try {
    const statistics = await newsletterService.getNewsletterStatistics();
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (err) {
    next(err);
  }
};

// Delete newsletter subscription (admin)
exports.deleteNewsletterSubscription = async (req, res, next) => {
  try {
    const result = await newsletterService.deleteNewsletterSubscription(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

