const DoctorsNote = require('../../models/DoctorsNote.model');
const DoctorNoteTemplate = require('../../models/DoctorNoteTemplate.model');
const Patient = require('../../models/Patient.model');
const AppError = require('../../utils/AppError');

// Get patient from userId
const getPatient = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) throw new AppError('Patient profile not found', 404);
  return patient;
};

// Create doctor's note
exports.createDoctorsNote = async (userId, data) => {
  const patient = await getPatient(userId);
  
  // Validate dates
  if (data.endDate < data.startDate) {
    throw new AppError('End date must be after start date', 400);
  }
  
  const doctorsNote = await DoctorsNote.create({
    patient: patient._id,
    type: data.type,
    purpose: data.purpose,
    startDate: data.startDate,
    endDate: data.endDate,
    patientName: data.patientName,
    price: data.price || 39.00
  });
  
  return doctorsNote;
};

// Get all doctor's notes (public - userId optional)
exports.getDoctorsNotes = async (userId = null) => {
  // If userId provided, return only that patient's notes
  if (userId) {
    const patient = await getPatient(userId);
    const notes = await DoctorsNote.find({ patient: patient._id })
      .sort({ createdAt: -1 });
    return notes;
  }
  
  // If no userId, return all notes (public access)
  const notes = await DoctorsNote.find()
    .sort({ createdAt: -1 });
  return notes;
};

// Get single doctor's note (public - userId optional)
exports.getDoctorsNoteById = async (userId, noteId) => {
  let query = { _id: noteId };
  
  // If userId provided, filter by patient
  if (userId) {
    const patient = await getPatient(userId);
    query.patient = patient._id;
  }
  
  const note = await DoctorsNote.findOne(query);
  
  if (!note) {
    throw new AppError('Doctor\'s note not found', 404);
  }
  
  return note;
};

// Update doctor's note
exports.updateDoctorsNote = async (userId, noteId, data) => {
  const patient = await getPatient(userId);
  
  const note = await DoctorsNote.findOne({
    _id: noteId,
    patient: patient._id
  });
  
  if (!note) {
    throw new AppError('Doctor\'s note not found', 404);
  }
  
  if (note.status !== 'pending') {
    throw new AppError('Cannot update note in current status', 400);
  }
  
  // Validate dates if provided
  if (data.endDate && data.startDate && data.endDate < data.startDate) {
    throw new AppError('End date must be after start date', 400);
  }
  
  Object.assign(note, data);
  await note.save();
  
  return note;
};

// Delete doctor's note
exports.deleteDoctorsNote = async (userId, noteId) => {
  const patient = await getPatient(userId);
  
  const note = await DoctorsNote.findOneAndDelete({
    _id: noteId,
    patient: patient._id,
    status: 'pending'
  });
  
  if (!note) {
    throw new AppError('Doctor\'s note not found or cannot be deleted', 404);
  }
  
  return { message: 'Doctor\'s note deleted successfully' };
};

// ==================== ADMIN TEMPLATE FUNCTIONS ====================

// Create doctor's note template (Admin)
exports.createTemplate = async (adminId, data) => {
  const template = await DoctorNoteTemplate.create({
    title: data.title || "Doctor's Note",
    productName: data.productName,
    price: data.price,
    description: data.description,
    shortDescription: data.shortDescription,
    coverageDays: data.coverageDays || 3,
    image: data.image,
    isActive: data.isActive !== undefined ? data.isActive : true,
    visibility: data.visibility !== undefined ? data.visibility : true,
    createdBy: adminId,
    order: data.order || 0
  });

  await template.populate('createdBy', 'firstName lastName email');
  return template;
};

// Get all templates (Public - only active, visible, and not deleted)
exports.getTemplates = async () => {
  const templates = await DoctorNoteTemplate.find({
    isActive: true,
    visibility: true,
    isDeleted: false
  })
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .sort({ order: 1, createdAt: -1 })
    .lean();
  
  return templates;
};

// Get all templates (Admin - all templates) with pagination
exports.getAllTemplatesAdmin = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    isActive,
    visibility,
    sortBy = 'order',
    sortOrder = 'asc'
  } = query;

  // Build filter
  const filter = {};

  // Exclude soft deleted by default (unless explicitly requested)
  const includeDeleted = query.includeDeleted === 'true' || query.includeDeleted === true;
  if (!includeDeleted) {
    filter.isDeleted = false;
  }

  // Search filter
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { productName: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Active filter
  if (isActive !== undefined) {
    if (isActive === 'true' || isActive === true || isActive === '1') {
      filter.isActive = true;
    } else if (isActive === 'false' || isActive === false || isActive === '0') {
      filter.isActive = false;
    }
  }

  // Visibility filter
  if (visibility !== undefined) {
    if (visibility === 'true' || visibility === true || visibility === '1') {
      filter.visibility = true;
    } else if (visibility === 'false' || visibility === false || visibility === '0') {
      filter.visibility = false;
    }
  }

  // Sorting
  const sort = {};
  if (sortBy === 'order') {
    sort.order = sortOrder === 'desc' ? -1 : 1;
    sort.createdAt = -1; // Secondary sort by creation date
  } else if (sortBy === 'price') {
    sort.price = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'createdAt') {
    sort.createdAt = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'updatedAt') {
    sort.updatedAt = sortOrder === 'desc' ? -1 : 1;
  } else {
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const limitNum = parseInt(limit);

  // Get templates
  const templates = await DoctorNoteTemplate.find(filter)
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .sort(sort)
    .skip(skip)
    .limit(limitNum)
    .lean();

  // Get total count
  const total = await DoctorNoteTemplate.countDocuments(filter);

  return {
    templates,
    pagination: {
      page: parseInt(page),
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  };
};

// Get template by ID (Public)
exports.getTemplateById = async (templateId) => {
  const template = await DoctorNoteTemplate.findOne({
    _id: templateId,
    isActive: true,
    visibility: true,
    isDeleted: false
  })
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .lean();
  
  if (!template) {
    throw new AppError('Template not found', 404);
  }
  
  return template;
};

// Get template by ID (Admin)
exports.getTemplateByIdAdmin = async (templateId) => {
  const template = await DoctorNoteTemplate.findById(templateId)
    .populate('createdBy', 'firstName lastName email')
    .populate('updatedBy', 'firstName lastName email')
    .populate('deletedBy', 'firstName lastName email')
    .lean();
  
  if (!template) {
    throw new AppError('Template not found', 404);
  }
  
  return template;
};

// Update template (Admin)
exports.updateTemplate = async (adminId, templateId, data) => {
  const template = await DoctorNoteTemplate.findById(templateId);
  
  if (!template) {
    throw new AppError('Template not found', 404);
  }
  
  Object.assign(template, {
    ...data,
    updatedBy: adminId
  });
  
  await template.save();
  await template.populate('createdBy', 'firstName lastName email');
  await template.populate('updatedBy', 'firstName lastName email');
  
  return template;
};

// Delete template (Soft Delete - Admin)
exports.deleteTemplate = async (templateId, adminId) => {
  const template = await DoctorNoteTemplate.findById(templateId);
  
  if (!template) {
    throw new AppError('Template not found', 404);
  }

  if (template.isDeleted) {
    throw new AppError('Template is already deleted', 400);
  }
  
  template.isDeleted = true;
  template.deletedAt = new Date();
  template.deletedBy = adminId;
  await template.save();
  
  return { message: 'Template deleted successfully' };
};

// Hard delete template (Permanent Delete - Admin)
exports.hardDeleteTemplate = async (templateId) => {
  const template = await DoctorNoteTemplate.findByIdAndDelete(templateId);
  
  if (!template) {
    throw new AppError('Template not found', 404);
  }
  
  return { message: 'Template permanently deleted successfully' };
};

// Restore template (Admin)
exports.restoreTemplate = async (templateId, adminId) => {
  const template = await DoctorNoteTemplate.findById(templateId);
  
  if (!template) {
    throw new AppError('Template not found', 404);
  }

  if (!template.isDeleted) {
    throw new AppError('Template is not deleted', 400);
  }
  
  template.isDeleted = false;
  template.deletedAt = null;
  template.deletedBy = null;
  template.updatedBy = adminId;
  await template.save();
  
  await template.populate('createdBy', 'firstName lastName email');
  await template.populate('updatedBy', 'firstName lastName email');
  
  return template;
};

