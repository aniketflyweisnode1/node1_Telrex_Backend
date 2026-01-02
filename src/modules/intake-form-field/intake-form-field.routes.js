const express = require('express');
const router = express.Router();
const intakeFormFieldController = require('./intake-form-field.controller');
const intakeFormFieldValidation = require('./intake-form-field.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// All routes require authentication and admin/sub-admin access
router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Add new intake form field
router.post(
  '/intake-form-fields',
  intakeFormFieldValidation.addIntakeFormFieldValidation,
  intakeFormFieldValidation.validateFieldTypeOptions,
  validate,
  intakeFormFieldController.addIntakeFormField
);

// Get all intake form fields
router.get('/intake-form-fields', intakeFormFieldController.getAllIntakeFormFields);

// Get fields by section
router.get('/intake-form-fields/section/:section', intakeFormFieldController.getFieldsBySection);

// Preview form - Get all fields organized by sections
router.get('/intake-form-fields/preview', intakeFormFieldController.previewForm);

// Get intake form field by ID
router.get('/intake-form-fields/:id', intakeFormFieldController.getIntakeFormFieldById);

// Update intake form field
router.put(
  '/intake-form-fields/:id',
  intakeFormFieldValidation.updateIntakeFormFieldValidation,
  intakeFormFieldValidation.validateFieldTypeOptions,
  validate,
  intakeFormFieldController.updateIntakeFormField
);

// Delete intake form field
router.delete('/intake-form-fields/:id', intakeFormFieldController.deleteIntakeFormField);

// Reorder fields
router.post(
  '/intake-form-fields/reorder',
  intakeFormFieldController.reorderFields
);

module.exports = router;

