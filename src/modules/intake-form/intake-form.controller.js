const intakeFormService = require('./intake-form.service');

// Get complete intake form
exports.getIntakeForm = async (req, res, next) => {
  try {
    const form = await intakeFormService.getIntakeForm(req.user.id);
    res.status(200).json({ success: true, data: form });
  } catch (err) { next(err); }
};

// Save Basic Information
exports.saveBasicInformation = async (req, res, next) => {
  try {
    const form = await intakeFormService.saveBasicInformation(req.user.id, req.body);
    res.status(200).json({ 
      success: true, 
      message: 'Basic information saved successfully', 
      data: form 
    });
  } catch (err) { next(err); }
};

// Save Emergency Contact
exports.saveEmergencyContact = async (req, res, next) => {
  try {
    const form = await intakeFormService.saveEmergencyContact(req.user.id, req.body);
    res.status(200).json({ 
      success: true, 
      message: 'Emergency contact saved successfully', 
      data: form 
    });
  } catch (err) { next(err); }
};

// Save Medical Questions
exports.saveMedicalQuestions = async (req, res, next) => {
  try {
    const form = await intakeFormService.saveMedicalQuestions(req.user.id, req.body);
    res.status(200).json({ 
      success: true, 
      message: 'Medical questions saved successfully', 
      data: form 
    });
  } catch (err) { next(err); }
};

// Legacy endpoints (for backward compatibility)
exports.createIntakeForm = async (req, res, next) => {
  try {
    const form = await intakeFormService.saveIntakeForm(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Intake form saved successfully', data: form });
  } catch (err) { next(err); }
};

exports.updateIntakeForm = async (req, res, next) => {
  try {
    const form = await intakeFormService.saveIntakeForm(req.user.id, req.body);
    res.status(200).json({ success: true, message: 'Intake form updated successfully', data: form });
  } catch (err) { next(err); }
};

