const express = require('express');
const router = express.Router();
const contactFormQueryController = require('./contact-form-query.controller');
const contactFormQueryValidation = require('./contact-form-query.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// Optional auth middleware - if token exists, authenticate; otherwise continue
const optionalAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    return authMiddleware(req, res, next);
  }
  next();
};

// Public route - anyone can submit a contact form query (with optional auth for logged-in users)
router.post(
  '/contact-form-queries',
  optionalAuth,
  contactFormQueryValidation.createContactFormQueryValidation,
  validate,
  contactFormQueryController.createContactFormQuery
);

// Admin routes - require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Get statistics
router.get('/contact-form-queries/statistics', contactFormQueryController.getContactFormQueryStatistics);

// Get all contact form queries
router.get(
  '/contact-form-queries',
  contactFormQueryValidation.getAllContactFormQueriesValidation,
  validate,
  contactFormQueryController.getAllContactFormQueries
);

// Get contact form query by ID
router.get('/contact-form-queries/:id', contactFormQueryController.getContactFormQueryById);

// Update contact form query
router.put(
  '/contact-form-queries/:id',
  contactFormQueryValidation.updateContactFormQueryValidation,
  validate,
  contactFormQueryController.updateContactFormQuery
);

// Delete contact form query
router.delete('/contact-form-queries/:id', contactFormQueryController.deleteContactFormQuery);

module.exports = router;

