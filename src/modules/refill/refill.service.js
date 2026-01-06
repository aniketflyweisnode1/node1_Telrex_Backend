const Refill = require('../../models/Refill.model');
const Prescription = require('../../models/Prescription.model');
const Patient = require('../../models/Patient.model');
const AppError = require('../../utils/AppError');

// Get patient by userId
const getPatient = async (userId) => {
  const Patient = require('../../models/Patient.model');
  const patient = await Patient.findOne({ user: userId });
  if (!patient) throw new AppError('Patient not found', 404);
  return patient;
};

// Get all refills for patient
exports.getRefills = async (userId, query = {}) => {
  const patient = await getPatient(userId);
  
  const filter = { patient: patient._id };
  
  // Status filter
  if (query.status) {
    filter.status = query.status;
  }
  
  // Prescription filter
  if (query.prescriptionId) {
    filter.prescription = query.prescriptionId;
  }
  
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;
  
  const refills = await Refill.find(filter)
    .populate({
      path: 'prescription',
      select: 'prescriptionNumber diagnosis medications status'
    })
    .populate({
      path: 'doctor',
      select: 'user specialty',
      populate: {
        path: 'user',
        select: 'firstName lastName email'
      }
    })
    .populate({
      path: 'order',
      select: 'orderNumber status totalAmount'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  const total = await Refill.countDocuments(filter);
  
  return {
    refills,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Get refill by ID
exports.getRefillById = async (userId, refillId) => {
  const patient = await getPatient(userId);
  
  const refill = await Refill.findOne({
    _id: refillId,
    patient: patient._id
  })
    .populate({
      path: 'prescription',
      select: 'prescriptionNumber diagnosis medications status createdAt'
    })
    .populate({
      path: 'doctor',
      select: 'user specialty licenseNumber',
      populate: {
        path: 'user',
        select: 'firstName lastName email phoneNumber'
      }
    })
    .populate({
      path: 'order',
      select: 'orderNumber status totalAmount items'
    })
    .lean();
  
  if (!refill) {
    throw new AppError('Refill not found', 404);
  }
  
  return refill;
};

// Request refill (refill now)
exports.requestRefill = async (userId, data) => {
  const patient = await getPatient(userId);
  
  // Get prescription
  const prescription = await Prescription.findOne({
    _id: data.prescriptionId,
    patient: patient._id,
    status: 'active'
  });
  
  if (!prescription) {
    throw new AppError('Prescription not found or not active', 404);
  }
  
  // Check if prescription has been ordered before (optional check)
  // Check for existing pending refills
  const existingRefill = await Refill.findOne({
    prescription: prescription._id,
    patient: patient._id,
    status: 'pending'
  });
  
  if (existingRefill) {
    throw new AppError('A pending refill already exists for this prescription', 409);
  }
  
  // Check refill count
  const refillCount = await Refill.countDocuments({
    prescription: prescription._id,
    patient: patient._id,
    status: { $in: ['approved', 'completed'] }
  });
  
  const maxRefills = data.maxRefills || 3;
  if (refillCount >= maxRefills) {
    throw new AppError(`Maximum refills (${maxRefills}) reached for this prescription`, 400);
  }
  
  // Prepare medications for refill
  // If specific medications provided, use them; otherwise use all from prescription
  let medications = [];
  if (data.medications && Array.isArray(data.medications) && data.medications.length > 0) {
    medications = data.medications;
  } else {
    // Use all medications from prescription
    medications = prescription.medications.map(med => ({
      medicationName: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      quantity: med.quantity,
      instructions: med.instructions || ''
    }));
  }
  
  // Create refill request
  const refill = await Refill.create({
    prescription: prescription._id,
    patient: patient._id,
    doctor: prescription.doctor,
    status: 'pending',
    requestedDate: new Date(),
    medications: medications,
    refillCount: refillCount + 1,
    maxRefills: maxRefills,
    notes: data.notes || ''
  });
  
  // Populate and return
  return await Refill.findById(refill._id)
    .populate({
      path: 'prescription',
      select: 'prescriptionNumber diagnosis medications status'
    })
    .populate({
      path: 'doctor',
      select: 'user specialty',
      populate: {
        path: 'user',
        select: 'firstName lastName email'
      }
    })
    .lean();
};

// Cancel refill
exports.cancelRefill = async (userId, refillId) => {
  const patient = await getPatient(userId);
  
  const refill = await Refill.findOne({
    _id: refillId,
    patient: patient._id
  });
  
  if (!refill) {
    throw new AppError('Refill not found', 404);
  }
  
  if (refill.status !== 'pending') {
    throw new AppError(`Cannot cancel refill with status: ${refill.status}`, 400);
  }
  
  refill.status = 'cancelled';
  await refill.save();
  
  return refill;
};

