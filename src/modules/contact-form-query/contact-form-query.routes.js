const express = require('express');
const router = express.Router();
const contactFormQueryController = require('./contact-form-query.controller');
const contactFormQueryValidation = require('./contact-form-query.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// Public route - Simple help desk contact form (firstName + email only) - NO AUTHENTICATION REQUIRED
router.post(
  '/',
  contactFormQueryValidation.createContactFormQueryValidation,
  validate,
  contactFormQueryController.createContactFormQuery
);

// Public route - Full contact form (all fields) - NO AUTHENTICATION REQUIRED
router.post(
  '/full',
  contactFormQueryValidation.createFullContactFormQueryValidation,
  validate,
  contactFormQueryController.createContactFormQuery
);

// Admin routes - require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Get statistics
router.get('/statistics', contactFormQueryController.getContactFormQueryStatistics);

// Get all contact form queries
router.get(
  '/',
  contactFormQueryValidation.getAllContactFormQueriesValidation,
  validate,
  contactFormQueryController.getAllContactFormQueries
);

// Get contact form query by ID
router.get('/:id', contactFormQueryController.getContactFormQueryById);

// Update contact form query
router.put(
  '/:id',
  contactFormQueryValidation.updateContactFormQueryValidation,
  validate,
  contactFormQueryController.updateContactFormQuery
);

// Delete contact form query
router.delete('/:id', contactFormQueryController.deleteContactFormQuery);

module.exports = router;

