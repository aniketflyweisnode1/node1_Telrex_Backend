const router = require('express').Router();
const controller = require('./doctors-note.controller');
const auth = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createTemplateValidation, updateTemplateValidation } = require('./doctors-note.validation');

// ==================== PUBLIC GET ROUTES (No Authentication) ====================
// Get all templates (Public - all templates including inactive)
router.get('/', controller.getAllTemplatesAdmin);
router.get('/getAll', controller.getAllTemplatesAdmin);

// Get template by ID (Public)
router.get('/:id', controller.getTemplateByIdAdmin);

// All routes below require authentication and admin/sub-admin access
router.use(auth);
router.use(isAdminOrSubAdmin);

// Create template (Admin)
router.post(
  '/',
  createTemplateValidation,
  validate,
  controller.createTemplate
);

// Update template (Admin)
router.put(
  '/:id',
  updateTemplateValidation,
  validate,
  controller.updateTemplate
);

// Delete template (Soft Delete - Admin)
router.delete('/:id', controller.deleteTemplate);

// Hard delete template (Permanent Delete - Admin)
router.delete('/:id/hard', controller.hardDeleteTemplate);

// Restore template (Admin)
router.put('/:id/restore', controller.restoreTemplate);

module.exports = router;

