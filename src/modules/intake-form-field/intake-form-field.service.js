const IntakeFormField = require('../../models/IntakeFormField.model');
const AppError = require('../../utils/AppError');

// Add new intake form field
exports.addIntakeFormField = async (data) => {
  // If order is not provided, set it to the next available order
  if (data.order === undefined || data.order === null) {
    const maxOrder = await IntakeFormField.findOne()
      .sort({ order: -1 })
      .select('order')
      .lean();
    data.order = maxOrder ? maxOrder.order + 1 : 0;
  }

  const field = await IntakeFormField.create(data);
  return field;
};

// Get all intake form fields
exports.getAllIntakeFormFields = async (query = {}) => {
  const { section, isActive } = query;
  
  const filter = {};
  
  if (section) {
    filter.section = section;
  }
  
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true' || isActive === true;
  } else {
    filter.isActive = true; // Default to active fields only
  }

  const fields = await IntakeFormField.find(filter)
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return fields;
};

// Get intake form field by ID
exports.getIntakeFormFieldById = async (fieldId) => {
  const field = await IntakeFormField.findById(fieldId);
  
  if (!field) {
    throw new AppError('Intake form field not found', 404);
  }
  
  return field;
};

// Update intake form field
exports.updateIntakeFormField = async (fieldId, data) => {
  const field = await IntakeFormField.findById(fieldId);
  
  if (!field) {
    throw new AppError('Intake form field not found', 404);
  }

  // Update fields
  if (data.fieldLabel !== undefined) field.fieldLabel = data.fieldLabel;
  if (data.fieldType !== undefined) field.fieldType = data.fieldType;
  if (data.isRequired !== undefined) field.isRequired = data.isRequired;
  if (data.placeholder !== undefined) field.placeholder = data.placeholder;
  if (data.helpText !== undefined) field.helpText = data.helpText;
  if (data.options !== undefined) field.options = data.options;
  if (data.validation !== undefined) field.validation = data.validation;
  if (data.order !== undefined) field.order = data.order;
  if (data.section !== undefined) field.section = data.section;
  if (data.isActive !== undefined) field.isActive = data.isActive;

  await field.save();
  return field;
};

// Delete intake form field (soft delete)
exports.deleteIntakeFormField = async (fieldId) => {
  const field = await IntakeFormField.findById(fieldId);
  
  if (!field) {
    throw new AppError('Intake form field not found', 404);
  }

  field.isActive = false;
  await field.save();
  
  return { message: 'Intake form field deleted successfully' };
};

// Reorder fields
exports.reorderFields = async (fieldOrders) => {
  // fieldOrders should be an array of { fieldId, order }
  const updatePromises = fieldOrders.map(({ fieldId, order }) =>
    IntakeFormField.findByIdAndUpdate(fieldId, { order }, { new: true })
  );
  
  await Promise.all(updatePromises);
  
  return { message: 'Fields reordered successfully' };
};

// Get fields by section
exports.getFieldsBySection = async (section) => {
  const fields = await IntakeFormField.find({
    section: section,
    isActive: true
  })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return fields;
};

// Preview form - Get all fields organized by sections
exports.previewForm = async () => {
  const allFields = await IntakeFormField.find({
    isActive: true
  })
    .sort({ section: 1, order: 1, createdAt: 1 })
    .lean();

  // Organize fields by section
  const sections = {
    basic_information: {
      sectionName: 'Basic Information',
      sectionKey: 'basic_information',
      fields: []
    },
    emergency_contact: {
      sectionName: 'Emergency Contact',
      sectionKey: 'emergency_contact',
      fields: []
    },
    medical_questions: {
      sectionName: 'Medical Questions',
      sectionKey: 'medical_questions',
      fields: []
    },
    custom: {
      sectionName: 'Additional Information',
      sectionKey: 'custom',
      fields: []
    }
  };

  // Group fields by section
  allFields.forEach(field => {
    const section = sections[field.section] || sections.custom;
    section.fields.push(field);
  });

  // Convert to array and remove empty sections
  const formSections = Object.values(sections).filter(section => section.fields.length > 0);

  return {
    totalFields: allFields.length,
    sections: formSections,
    fields: allFields // Also return flat list for convenience
  };
};

