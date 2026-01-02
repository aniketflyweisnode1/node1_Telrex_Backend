const DoctorsNote = require('../../models/DoctorsNote.model');
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

// Get all doctor's notes
exports.getDoctorsNotes = async (userId) => {
  const patient = await getPatient(userId);
  const notes = await DoctorsNote.find({ patient: patient._id })
    .sort({ createdAt: -1 });
  return notes;
};

// Get single doctor's note
exports.getDoctorsNoteById = async (userId, noteId) => {
  const patient = await getPatient(userId);
  const note = await DoctorsNote.findOne({
    _id: noteId,
    patient: patient._id
  });
  
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

