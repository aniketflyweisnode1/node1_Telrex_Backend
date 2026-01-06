const express = require('express');
const router = express.Router();
const newsletterController = require('./newsletter.controller');
const newsletterValidation = require('./newsletter.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// ==================== PUBLIC ROUTES (No Authentication Required) ====================

// Subscribe to newsletter
router.post(
  '/subscribe',
  newsletterValidation.subscribeNewsletterValidation,
  validate,
  newsletterController.subscribeNewsletter
);

// Unsubscribe from newsletter
router.post(
  '/unsubscribe',
  newsletterValidation.unsubscribeNewsletterValidation,
  validate,
  newsletterController.unsubscribeNewsletter
);

// ==================== PROTECTED ROUTES (Admin/Sub-Admin Only) ====================
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Get newsletter statistics
router.get('/statistics', newsletterController.getNewsletterStatistics);

// Get all newsletter subscriptions
router.get(
  '/',
  newsletterValidation.getAllNewsletterSubscriptionsValidation,
  validate,
  newsletterController.getAllNewsletterSubscriptions
);

// Delete newsletter subscription
router.delete(
  '/:id',
  newsletterValidation.newsletterIdValidation,
  validate,
  newsletterController.deleteNewsletterSubscription
);

module.exports = router;

