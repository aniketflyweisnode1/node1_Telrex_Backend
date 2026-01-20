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

// Get all doctor's notes (public - authentication optional)
exports.getDoctorsNotes = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const notes = await doctorsNoteService.getDoctorsNotes(userId);
    res.status(200).json({ success: true, data: notes });
  } catch (err) { next(err); }
};

// Get single doctor's note (public - authentication optional)
exports.getDoctorsNoteById = async (req, res, next) => {
  try {
    const userId = req.user?.id || null;
    const note = await doctorsNoteService.getDoctorsNoteById(userId, req.params.id);
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

// ==================== ADMIN TEMPLATE CONTROLLERS ====================

// Create template (Admin)
exports.createTemplate = async (req, res, next) => {
  try {
    const template = await doctorsNoteService.createTemplate(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Template created successfully',
      data: template
    });
  } catch (err) { next(err); }
};

// Get all templates (Public)
exports.getTemplates = async (req, res, next) => {
  try {
    const templates = await doctorsNoteService.getTemplates();
    res.status(200).json({
      success: true,
      data: templates
    });
  } catch (err) { next(err); }
};

// Get all templates (Admin) with pagination
exports.getAllTemplatesAdmin = async (req, res, next) => {
  try {
    const result = await doctorsNoteService.getAllTemplatesAdmin(req.query);
    res.status(200).json({
      success: true,
      data: result.templates,
      pagination: result.pagination
    });
  } catch (err) { next(err); }
};

// Get template by ID (Public)
exports.getTemplateById = async (req, res, next) => {
  try {
    const template = await doctorsNoteService.getTemplateById(req.params.id);
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (err) { next(err); }
};

// Get template by ID (Admin)
exports.getTemplateByIdAdmin = async (req, res, next) => {
  try {
    const template = await doctorsNoteService.getTemplateByIdAdmin(req.params.id);
    res.status(200).json({
      success: true,
      data: template
    });
  } catch (err) { next(err); }
};

// Update template (Admin)
exports.updateTemplate = async (req, res, next) => {
  try {
    const template = await doctorsNoteService.updateTemplate(req.user.id, req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Template updated successfully',
      data: template
    });
  } catch (err) { next(err); }
};

// Delete template (Soft Delete - Admin)
exports.deleteTemplate = async (req, res, next) => {
  try {
    const result = await doctorsNoteService.deleteTemplate(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) { next(err); }
};

// Hard delete template (Permanent Delete - Admin)
exports.hardDeleteTemplate = async (req, res, next) => {
  try {
    const result = await doctorsNoteService.hardDeleteTemplate(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) { next(err); }
};

// Restore template (Admin)
exports.restoreTemplate = async (req, res, next) => {
  try {
    const template = await doctorsNoteService.restoreTemplate(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Template restored successfully',
      data: template
    });
  } catch (err) { next(err); }
};

