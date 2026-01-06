const express = require('express');
const router = express.Router();
const footerController = require('./footer.controller');
const footerValidation = require('./footer.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const optionalAuthMiddleware = require('../../middlewares/optionalAuth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// Helper middleware to set section parameter
const setSectionParam = (sectionName) => (req, res, next) => {
  req.params.section = sectionName;
  next();
};

// Helper middleware to get section ID from section name
const getSectionId = (sectionName) => async (req, res, next) => {
  try {
    const Footer = require('../../models/Footer.model');
    const section = await Footer.findOne({ section: sectionName });
    if (!section) {
      return res.status(404).json({
        success: false,
        message: 'Footer section not found'
      });
    }
    req.params.id = section._id.toString();
    next();
  } catch (err) {
    next(err);
  }
};

// ==================== PUBLIC GET ROUTES (No Authentication Required) ====================
// These routes are accessible without token and only return published sections

// Get all footer sections (public - only published)
router.get(
  '/',
  footerValidation.getAllFooterSectionsValidation,
  validate,
  footerController.getAllFooterSections
);

// Get footer section by section name (public - only published)
router.get(
  '/section/:section',
  footerValidation.sectionNameValidation,
  validate,
  footerController.getFooterSectionBySection
);

// Individual section GET routes (public - only published) - Must come before /:id route
router.get('/logo', setSectionParam('logo'), footerController.getFooterSectionBySection);
router.get('/about', setSectionParam('about-us'), footerController.getFooterSectionBySection);
router.get('/how-works', setSectionParam('how-works'), footerController.getFooterSectionBySection);
router.get('/leadership', setSectionParam('leadership'), footerController.getFooterSectionBySection);
router.get('/faq', setSectionParam('faq'), footerController.getFooterSectionBySection);
router.get('/careers', setSectionParam('careers'), footerController.getFooterSectionBySection);
router.get('/support', setSectionParam('support'), footerController.getFooterSectionBySection);
router.get('/blogs', setSectionParam('blogs'), footerController.getFooterSectionBySection);
router.get('/shipping-returns', setSectionParam('shipping-returns'), footerController.getFooterSectionBySection);
router.get('/privacy-policy', setSectionParam('privacy-policy'), footerController.getFooterSectionBySection);
router.get('/terms-conditions', setSectionParam('terms-conditions'), footerController.getFooterSectionBySection);
router.get('/consent-telehealth', setSectionParam('consent-telehealth'), footerController.getFooterSectionBySection);
router.get('/contact', setSectionParam('contact'), footerController.getFooterSectionBySection);
router.get('/address', setSectionParam('address'), footerController.getFooterSectionBySection);
router.get('/social-media', setSectionParam('social-media'), footerController.getFooterSectionBySection);

// Get footer section by ID (public - only published) - Must come after specific routes
router.get('/:id', footerController.getFooterSectionById);

// ==================== PROTECTED ROUTES (Admin/Sub-Admin Only) ====================
// All POST, PUT, DELETE routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Logo section - POST, PUT, DELETE (GET already defined above)
router.post('/logo', setSectionParam('logo'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/logo', setSectionParam('logo'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/logo/publish', getSectionId('logo'), footerController.publishFooterSection);
router.put('/logo/draft', getSectionId('logo'), footerController.saveAsDraft);
router.delete('/logo', getSectionId('logo'), footerController.deleteFooterSection);

// About Us section - POST, PUT, DELETE (GET already defined above)
router.post('/about', setSectionParam('about-us'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/about', setSectionParam('about-us'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/about/publish', getSectionId('about-us'), footerController.publishFooterSection);
router.put('/about/draft', getSectionId('about-us'), footerController.saveAsDraft);
router.delete('/about', getSectionId('about-us'), footerController.deleteFooterSection);

// How Works section - POST, PUT, DELETE (GET already defined above)
router.post('/how-works', setSectionParam('how-works'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/how-works', setSectionParam('how-works'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/how-works/publish', getSectionId('how-works'), footerController.publishFooterSection);
router.put('/how-works/draft', getSectionId('how-works'), footerController.saveAsDraft);
router.delete('/how-works', getSectionId('how-works'), footerController.deleteFooterSection);

// Leadership section - POST, PUT, DELETE (GET already defined above)
router.post('/leadership', setSectionParam('leadership'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/leadership', setSectionParam('leadership'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/leadership/publish', getSectionId('leadership'), footerController.publishFooterSection);
router.put('/leadership/draft', getSectionId('leadership'), footerController.saveAsDraft);
router.delete('/leadership', getSectionId('leadership'), footerController.deleteFooterSection);

// FAQ section - POST, PUT, DELETE (GET already defined above)
router.post('/faq', setSectionParam('faq'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/faq', setSectionParam('faq'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/faq/publish', getSectionId('faq'), footerController.publishFooterSection);
router.put('/faq/draft', getSectionId('faq'), footerController.saveAsDraft);
router.delete('/faq', getSectionId('faq'), footerController.deleteFooterSection);

// Careers section - POST, PUT, DELETE (GET already defined above)
router.post('/careers', setSectionParam('careers'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/careers', setSectionParam('careers'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/careers/publish', getSectionId('careers'), footerController.publishFooterSection);
router.put('/careers/draft', getSectionId('careers'), footerController.saveAsDraft);
router.delete('/careers', getSectionId('careers'), footerController.deleteFooterSection);

// Support section - POST, PUT, DELETE (GET already defined above)
router.post('/support', setSectionParam('support'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/support', setSectionParam('support'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/support/publish', getSectionId('support'), footerController.publishFooterSection);
router.put('/support/draft', getSectionId('support'), footerController.saveAsDraft);
router.delete('/support', getSectionId('support'), footerController.deleteFooterSection);

// Blogs section - POST, PUT, DELETE (GET already defined above)
router.post('/blogs', setSectionParam('blogs'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/blogs', setSectionParam('blogs'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/blogs/publish', getSectionId('blogs'), footerController.publishFooterSection);
router.put('/blogs/draft', getSectionId('blogs'), footerController.saveAsDraft);
router.delete('/blogs', getSectionId('blogs'), footerController.deleteFooterSection);

// Shipping & Returns section - POST, PUT, DELETE (GET already defined above)
router.post('/shipping-returns', setSectionParam('shipping-returns'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/shipping-returns', setSectionParam('shipping-returns'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/shipping-returns/publish', getSectionId('shipping-returns'), footerController.publishFooterSection);
router.put('/shipping-returns/draft', getSectionId('shipping-returns'), footerController.saveAsDraft);
router.delete('/shipping-returns', getSectionId('shipping-returns'), footerController.deleteFooterSection);

// Privacy Policy section - POST, PUT, DELETE (GET already defined above)
router.post('/privacy-policy', setSectionParam('privacy-policy'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/privacy-policy', setSectionParam('privacy-policy'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/privacy-policy/publish', getSectionId('privacy-policy'), footerController.publishFooterSection);
router.put('/privacy-policy/draft', getSectionId('privacy-policy'), footerController.saveAsDraft);
router.delete('/privacy-policy', getSectionId('privacy-policy'), footerController.deleteFooterSection);

// Terms & Conditions section - POST, PUT, DELETE (GET already defined above)
router.post('/terms-conditions', setSectionParam('terms-conditions'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/terms-conditions', setSectionParam('terms-conditions'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/terms-conditions/publish', getSectionId('terms-conditions'), footerController.publishFooterSection);
router.put('/terms-conditions/draft', getSectionId('terms-conditions'), footerController.saveAsDraft);
router.delete('/terms-conditions', getSectionId('terms-conditions'), footerController.deleteFooterSection);

// Consent to Telehealth section - POST, PUT, DELETE (GET already defined above)
router.post('/consent-telehealth', setSectionParam('consent-telehealth'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/consent-telehealth', setSectionParam('consent-telehealth'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/consent-telehealth/publish', getSectionId('consent-telehealth'), footerController.publishFooterSection);
router.put('/consent-telehealth/draft', getSectionId('consent-telehealth'), footerController.saveAsDraft);
router.delete('/consent-telehealth', getSectionId('consent-telehealth'), footerController.deleteFooterSection);

// Contact section - POST, PUT, DELETE (GET already defined above)
router.post('/contact', setSectionParam('contact'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/contact', setSectionParam('contact'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/contact/publish', getSectionId('contact'), footerController.publishFooterSection);
router.put('/contact/draft', getSectionId('contact'), footerController.saveAsDraft);
router.delete('/contact', getSectionId('contact'), footerController.deleteFooterSection);

// Address section - POST, PUT, DELETE (GET already defined above)
router.post('/address', setSectionParam('address'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/address', setSectionParam('address'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/address/publish', getSectionId('address'), footerController.publishFooterSection);
router.put('/address/draft', getSectionId('address'), footerController.saveAsDraft);
router.delete('/address', getSectionId('address'), footerController.deleteFooterSection);

// Social Media section - POST, PUT, DELETE (GET already defined above)
router.post('/social-media', setSectionParam('social-media'), footerValidation.createFooterSectionValidation, validate, footerController.createFooterSection);
router.put('/social-media', setSectionParam('social-media'), footerValidation.updateFooterSectionValidation, validate, footerController.updateFooterSectionBySection);
router.put('/social-media/publish', getSectionId('social-media'), footerController.publishFooterSection);
router.put('/social-media/draft', getSectionId('social-media'), footerController.saveAsDraft);
router.delete('/social-media', getSectionId('social-media'), footerController.deleteFooterSection);

// ==================== GENERIC ROUTES ====================

// Create footer section
router.post(
  '/',
  footerValidation.createFooterSectionValidation,
  validate,
  footerController.createFooterSection
);

// Update footer section by ID
router.put(
  '/:id',
  footerValidation.updateFooterSectionValidation,
  validate,
  footerController.updateFooterSection
);

// Update footer section by section name (backward compatibility)
router.put(
  '/section/:section',
  footerValidation.sectionNameValidation,
  footerValidation.updateFooterSectionValidation,
  validate,
  footerController.updateFooterSectionBySection
);

// Publish footer section
router.put(
  '/:id/publish',
  footerController.publishFooterSection
);

// Save as draft
router.put(
  '/:id/draft',
  footerController.saveAsDraft
);

// Delete footer section
router.delete('/:id', footerController.deleteFooterSection);

module.exports = router;

