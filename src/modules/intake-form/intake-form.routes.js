const router = require('express').Router();
const controller = require('./intake-form.controller');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const {
  basicInformationValidation,
  emergencyContactValidation,
  medicalQuestionsValidation,
  submitConsultationValidation
} = require('./intake-form.validation');

// Get complete intake form
router.get('/intake-form', auth, controller.getIntakeForm);

// Section-wise save endpoints
router.post('/intake-form/basic-information', auth, basicInformationValidation, validate, controller.saveBasicInformation);
router.post('/intake-form/emergency-contact', auth, emergencyContactValidation, validate, controller.saveEmergencyContact);
router.post('/intake-form/medical-questions', auth, medicalQuestionsValidation, validate, controller.saveMedicalQuestions);

// Submit consultation (book consultation)
router.post('/intake-form/submit', auth, submitConsultationValidation, validate, controller.submitConsultation);

// Legacy endpoints (for backward compatibility)
router.post('/intake-form', auth, controller.createIntakeForm);
router.put('/intake-form', auth, controller.updateIntakeForm);

module.exports = router;

