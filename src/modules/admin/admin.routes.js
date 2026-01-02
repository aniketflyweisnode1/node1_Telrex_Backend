const express = require('express');
const router = express.Router();
const adminController = require('./admin.controller');
const adminValidation = require('./admin.validation');
const authMiddleware = require('../../middlewares/auth.middleware');
const { isAdmin } = require('../../middlewares/admin.middleware');

// Admin registration (public route - for initial setup)
router.post(
  '/register',
  adminValidation.adminRegisterValidation,
  adminController.adminRegister
);

// Admin login (public route)
router.post(
  '/login',
  adminValidation.adminLoginValidation,
  adminController.adminLogin
);

// All routes below require admin authentication
router.use(authMiddleware);
router.use(isAdmin);

// Get available modules
router.get('/modules', adminController.getAvailableModules);

// Sub-admin routes
router.post(
  '/sub-admins',
  adminValidation.createSubAdminValidation,
  adminController.createSubAdmin
);

router.get('/sub-admins', adminController.getAllSubAdmins);

router.get('/sub-admins/:id', adminController.getSubAdminById);

router.put(
  '/sub-admins/:id',
  adminValidation.updateSubAdminValidation,
  adminController.updateSubAdmin
);

router.delete('/sub-admins/:id', adminController.deleteSubAdmin);

router.put(
  '/sub-admins/:id/permissions',
  adminValidation.setPermissionsValidation,
  adminController.setPermissions
);

module.exports = router;

