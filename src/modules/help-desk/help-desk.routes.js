const express = require('express');
const router = express.Router();
const helpDeskController = require('./help-desk.controller');
const helpDeskValidation = require('./help-desk.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');

// ==================== PUBLIC ROUTES ====================

// Create help desk query (Public - no authentication required)
router.post(
  '/help-desk',
  helpDeskValidation.createHelpDeskQueryValidation,
  validate,
  helpDeskController.createHelpDeskQuery
);

// ==================== PROTECTED ROUTES (Admin/Sub-Admin Only) ====================

router.use(authMiddleware);
router.use(isAdminOrSubAdmin);

// Get all help desk queries
router.get(
  '/help-desk',
  helpDeskValidation.getAllHelpDeskQueriesValidation,
  validate,
  helpDeskController.getAllHelpDeskQueries
);

// Get help desk statistics
router.get(
  '/help-desk/statistics',
  helpDeskController.getHelpDeskStatistics
);

// Get help desk query by ID
router.get(
  '/help-desk/:id',
  helpDeskValidation.helpDeskQueryIdValidation,
  validate,
  helpDeskController.getHelpDeskQueryById
);

// Update help desk query
router.put(
  '/help-desk/:id',
  helpDeskValidation.updateHelpDeskQueryValidation,
  validate,
  helpDeskController.updateHelpDeskQuery
);

// Delete help desk query
router.delete(
  '/help-desk/:id',
  helpDeskValidation.helpDeskQueryIdValidation,
  validate,
  helpDeskController.deleteHelpDeskQuery
);

module.exports = router;

