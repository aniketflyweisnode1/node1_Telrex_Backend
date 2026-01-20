const router = require('express').Router();
const controller = require('./doctors-note.controller');
const auth = require('../../middlewares/auth.middleware');
const { isAdminOrSubAdmin } = require('../../middlewares/admin.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createDoctorsNoteValidation, createTemplateValidation, updateTemplateValidation } = require('./doctors-note.validation');

// Get all doctor's notes
router.get('/doctors-notes', controller.getDoctorsNotes);

// Get single doctor's note
router.get('/doctors-notes/:id', controller.getDoctorsNoteById);

// Create doctor's note
router.post('/doctors-notes', auth, createDoctorsNoteValidation, validate, controller.createDoctorsNote);

// Create doctor's note and add to cart
router.post('/doctors-notes/add-to-cart', auth, createDoctorsNoteValidation, validate, controller.createAndAddToCart);

// Update doctor's note
router.put('/doctors-notes/:id', auth, createDoctorsNoteValidation, validate, controller.updateDoctorsNote);

// Delete doctor's note
router.delete('/doctors-notes/:id', auth, controller.deleteDoctorsNote);

// ==================== TEMPLATE ROUTES (PUBLIC) ====================
// Get all templates (Public - no authentication required)
router.get('/doctors-note-templates', controller.getTemplates);

// Get template by ID (Public - no authentication required)
router.get('/doctors-note-templates/:id', controller.getTemplateById);

module.exports = router;

