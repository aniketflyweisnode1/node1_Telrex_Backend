const SavedMedicine = require('../../models/SavedMedicine.model');
const Medicine = require('../../models/Medicine.model');
const Patient = require('../../models/Patient.model');
const AppError = require('../../utils/AppError');

// Helper function to get or create patient
async function getPatient(userId) {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) {
    throw new AppError('Patient profile not found', 404);
  }
  return patient;
}

// Save medicine
exports.saveMedicine = async (userId, medicineId) => {
  const patient = await getPatient(userId);
  
  // Check if medicine exists and is active
  const medicine = await Medicine.findOne({
    _id: medicineId,
    isActive: true,
    visibility: true
  });
  
  if (!medicine) {
    throw new AppError('Medicine not found or not available', 404);
  }
  
  // Check if already saved
  const existingSaved = await SavedMedicine.findOne({
    patient: patient._id,
    medicine: medicineId
  });
  
  if (existingSaved) {
    throw new AppError('Medicine is already saved', 409);
  }
  
  // Save medicine
  const savedMedicine = await SavedMedicine.create({
    patient: patient._id,
    medicine: medicineId
  });
  
  // Populate and return
  return await SavedMedicine.findById(savedMedicine._id)
    .populate({
      path: 'medicine',
      select: 'productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive healthCategory healthTypeSlug isTrendy isBestOffer discountPercentage',
      populate: {
        path: 'healthCategory',
        select: 'name slug description icon types',
        match: { isActive: true }
      }
    })
    .lean();
};

// Unsave medicine (remove from saved)
exports.unsaveMedicine = async (userId, medicineId) => {
  const patient = await getPatient(userId);
  
  const savedMedicine = await SavedMedicine.findOneAndDelete({
    patient: patient._id,
    medicine: medicineId
  });
  
  if (!savedMedicine) {
    throw new AppError('Saved medicine not found', 404);
  }
  
  return { message: 'Medicine removed from saved list successfully' };
};

// Get all saved medicines for patient
exports.getSavedMedicines = async (userId, query = {}) => {
  const patient = await getPatient(userId);
  
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;
  
  const filter = { patient: patient._id };
  
  // Find saved medicines with pagination
  const savedMedicines = await SavedMedicine.find(filter)
    .populate({
      path: 'medicine',
      select: 'productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive healthCategory healthTypeSlug isTrendy isBestOffer discountPercentage views',
      populate: {
        path: 'healthCategory',
        select: 'name slug description icon types',
        match: { isActive: true }
      },
      match: { isActive: true, visibility: true }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
  
  // Filter out null medicines (if medicine was deleted or made inactive)
  const validSavedMedicines = savedMedicines.filter(item => item.medicine !== null);
  
  const total = await SavedMedicine.countDocuments(filter);
  
  return {
    savedMedicines: validSavedMedicines,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

// Check if medicine is saved
exports.isMedicineSaved = async (userId, medicineId) => {
  const patient = await getPatient(userId);
  
  const savedMedicine = await SavedMedicine.findOne({
    patient: patient._id,
    medicine: medicineId
  });
  
  return { isSaved: !!savedMedicine };
};

