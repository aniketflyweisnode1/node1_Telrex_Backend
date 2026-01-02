const router = require('express').Router();
const controller = require('./patient.controller');
const validate = require('../../middlewares/validate.middleware');
const auth = require('../../middlewares/auth.middleware');
const { updateProfileValidation } = require('./patient.validation');

// Profile routes
router.get('/profile', auth, controller.getProfile);
router.put('/profile', auth, updateProfileValidation, validate, controller.updateProfile);

module.exports = router;

