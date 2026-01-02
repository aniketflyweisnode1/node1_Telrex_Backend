const HealthRecord = require('../../models/HealthRecord.model');
const Patient = require('../../models/Patient.model');
const AppError = require('../../utils/AppError');

// Get patient from userId
const getPatient = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) throw new AppError('Patient profile not found', 404);
  return patient;
};

// Get all health records
exports.getHealthRecords = async (userId, query = {}) => {
  const patient = await getPatient(userId);
  
  const filter = { patient: patient._id };
  if (query.type) filter.type = query.type;
  
  const records = await HealthRecord.find(filter)
    .populate('doctor', 'firstName lastName')
    .populate('sharedWith.doctor', 'firstName lastName')
    .sort({ date: -1, createdAt: -1 });
  
  return records;
};

// Create health record
exports.createHealthRecord = async (userId, data) => {
  const patient = await getPatient(userId);
  
  const record = await HealthRecord.create({
    patient: patient._id,
    ...data
  });
  
  return await HealthRecord.findById(record._id)
    .populate('doctor', 'firstName lastName');
};

// Share health record
exports.shareHealthRecord = async (userId, recordId, data) => {
  const patient = await getPatient(userId);
  
  const record = await HealthRecord.findOne({
    _id: recordId,
    patient: patient._id
  });
  
  if (!record) throw new AppError('Health record not found', 404);
  
  // Add doctors to sharedWith
  if (data.doctorIds && Array.isArray(data.doctorIds)) {
    data.doctorIds.forEach(doctorId => {
      const exists = record.sharedWith.some(share => share.doctor.toString() === doctorId);
      if (!exists) {
        record.sharedWith.push({ doctor: doctorId });
      }
    });
  }
  
  record.isShared = true;
  await record.save();
  
  return await HealthRecord.findById(record._id)
    .populate('doctor', 'firstName lastName')
    .populate('sharedWith.doctor', 'firstName lastName');
};

