const doctorsNoteService = require('./doctors-note.service');
const cartService = require('../cart/cart.service');

// Create doctor's note
exports.createDoctorsNote = async (req, res, next) => {
  try {
    const note = await doctorsNoteService.createDoctorsNote(req.user.id, req.body);
    res.status(201).json({ 
      success: true, 
      message: 'Doctor\'s note created successfully', 
      data: note 
    });
  } catch (err) { next(err); }
};

// Create doctor's note and add to cart
exports.createAndAddToCart = async (req, res, next) => {
  try {
    // Create doctor's note
    const note = await doctorsNoteService.createDoctorsNote(req.user.id, req.body);
    
    // Add to cart
    const cart = await cartService.addToCart(req.user.id, {
      productId: note._id.toString(),
      productName: 'Doctor\'s Note - Excuse Note',
      productType: 'doctors_note',
      quantity: 1,
      unitPrice: note.price
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Doctor\'s note created and added to cart', 
      data: { note, cart } 
    });
  } catch (err) { next(err); }
};

// Get all doctor's notes
exports.getDoctorsNotes = async (req, res, next) => {
  try {
    const notes = await doctorsNoteService.getDoctorsNotes(req.user.id);
    res.status(200).json({ success: true, data: notes });
  } catch (err) { next(err); }
};

// Get single doctor's note
exports.getDoctorsNoteById = async (req, res, next) => {
  try {
    const note = await doctorsNoteService.getDoctorsNoteById(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: note });
  } catch (err) { next(err); }
};

// Update doctor's note
exports.updateDoctorsNote = async (req, res, next) => {
  try {
    const note = await doctorsNoteService.updateDoctorsNote(req.user.id, req.params.id, req.body);
    res.status(200).json({ 
      success: true, 
      message: 'Doctor\'s note updated successfully', 
      data: note 
    });
  } catch (err) { next(err); }
};

// Delete doctor's note
exports.deleteDoctorsNote = async (req, res, next) => {
  try {
    const result = await doctorsNoteService.deleteDoctorsNote(req.user.id, req.params.id);
    res.status(200).json({ 
      success: true, 
      message: result.message 
    });
  } catch (err) { next(err); }
};

