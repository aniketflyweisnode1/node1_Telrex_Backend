const router = require('express').Router();
const controller = require('./doctors-note.controller');
const auth = require('../../middlewares/auth.middleware');
const validate = require('../../middlewares/validate.middleware');
const { createDoctorsNoteValidation } = require('./doctors-note.validation');

// Get all doctor's notes
router.get('/doctors-notes', auth, controller.getDoctorsNotes);

// Get single doctor's note
router.get('/doctors-notes/:id', auth, controller.getDoctorsNoteById);

// Create doctor's note
router.post('/doctors-notes', auth, createDoctorsNoteValidation, validate, controller.createDoctorsNote);

// Create doctor's note and add to cart
router.post('/doctors-notes/add-to-cart', auth, createDoctorsNoteValidation, validate, controller.createAndAddToCart);

// Update doctor's note
router.put('/doctors-notes/:id', auth, createDoctorsNoteValidation, validate, controller.updateDoctorsNote);

// Delete doctor's note
router.delete('/doctors-notes/:id', auth, controller.deleteDoctorsNote);

module.exports = router;

