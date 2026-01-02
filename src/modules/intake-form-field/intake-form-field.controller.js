const intakeFormFieldService = require('./intake-form-field.service');

// Add new intake form field
exports.addIntakeFormField = async (req, res, next) => {
  try {
    const field = await intakeFormFieldService.addIntakeFormField(req.body);
    res.status(201).json({
      success: true,
      message: 'Intake form field added successfully',
      data: field
    });
  } catch (err) {
    next(err);
  }
};

// Get all intake form fields
exports.getAllIntakeFormFields = async (req, res, next) => {
  try {
    const fields = await intakeFormFieldService.getAllIntakeFormFields(req.query);
    res.status(200).json({
      success: true,
      data: fields
    });
  } catch (err) {
    next(err);
  }
};

// Get intake form field by ID
exports.getIntakeFormFieldById = async (req, res, next) => {
  try {
    const field = await intakeFormFieldService.getIntakeFormFieldById(req.params.id);
    res.status(200).json({
      success: true,
      data: field
    });
  } catch (err) {
    next(err);
  }
};

// Update intake form field
exports.updateIntakeFormField = async (req, res, next) => {
  try {
    const field = await intakeFormFieldService.updateIntakeFormField(req.params.id, req.body);
    res.status(200).json({
      success: true,
      message: 'Intake form field updated successfully',
      data: field
    });
  } catch (err) {
    next(err);
  }
};

// Delete intake form field
exports.deleteIntakeFormField = async (req, res, next) => {
  try {
    const result = await intakeFormFieldService.deleteIntakeFormField(req.params.id);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

// Reorder fields
exports.reorderFields = async (req, res, next) => {
  try {
    const result = await intakeFormFieldService.reorderFields(req.body.fieldOrders);
    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

// Get fields by section
exports.getFieldsBySection = async (req, res, next) => {
  try {
    const fields = await intakeFormFieldService.getFieldsBySection(req.params.section);
    res.status(200).json({
      success: true,
      data: fields
    });
  } catch (err) {
    next(err);
  }
};

// Preview form - Get all fields organized by sections
exports.previewForm = async (req, res, next) => {
  try {
    const formData = await intakeFormFieldService.previewForm();
    res.status(200).json({
      success: true,
      message: 'Form preview retrieved successfully',
      data: formData
    });
  } catch (err) {
    next(err);
  }
};

