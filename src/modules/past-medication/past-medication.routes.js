const router = require('express').Router();
const controller = require('./past-medication.controller');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { pastMedicationValidation } = require('./past-medication.validation');

// Get all past medications
router.get('/past-medications', controller.getAllPastMedications);

// Get single past medication by ID
router.get('/past-medications/:id', controller.getPastMedicationById);

// Add new past medication record
router.post('/past-medications', auth, pastMedicationValidation, validate, controller.addPastMedication);

// Update past medication record
router.put('/past-medications/:id', auth, pastMedicationValidation, validate, controller.updatePastMedication);

// Remove past medication record
router.delete('/past-medications/:id', auth, controller.removePastMedication);

module.exports = router;

