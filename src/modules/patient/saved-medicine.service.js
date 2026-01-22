/**
 * Saved Medicine Service
 * Refactored to use shared helpers
 */

const SavedMedicine = require('../../models/SavedMedicine.model');
const Medicine = require('../../models/Medicine.model');
const AppError = require('../../utils/AppError');
const { getPatient, parsePagination, buildPaginationResponse } = require('../../helpers');

// Medicine populate options
const MEDICINE_POPULATE = {
  path: 'medicine',
  select: 'productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive healthCategory healthTypeSlug isTrendy isBestOffer discountPercentage views',
  populate: {
    path: 'healthCategory',
    select: 'name slug description icon types',
    match: { isActive: true }
  }
};

/**
 * Save medicine to favorites
 */
exports.saveMedicine = async (userId, medicineId) => {
  const patient = await getPatient(userId);
  
  // Check medicine exists AND not already saved in parallel
  const [medicine, existingSaved] = await Promise.all([
    Medicine.findOne({ _id: medicineId, isActive: true, visibility: true })
      .select('_id')
      .lean(),
    SavedMedicine.exists({ patient: patient._id, medicine: medicineId })
  ]);
  
  if (!medicine) throw new AppError('Medicine not found or not available', 404);
  if (existingSaved) throw new AppError('Medicine is already saved', 409);
  
  // Create and return with populated data
  const savedMedicine = await SavedMedicine.create({
    patient: patient._id,
    medicine: medicineId
  });
  
  return await SavedMedicine.findById(savedMedicine._id)
    .populate(MEDICINE_POPULATE)
    .lean();
};

/**
 * Remove medicine from favorites
 */
exports.unsaveMedicine = async (userId, medicineId) => {
  const patient = await getPatient(userId);
  
  const result = await SavedMedicine.findOneAndDelete({
    patient: patient._id,
    medicine: medicineId
  });
  
  if (!result) throw new AppError('Saved medicine not found', 404);
  
  return { message: 'Medicine removed from saved list successfully' };
};

/**
 * Get all saved medicines with pagination
 */
exports.getSavedMedicines = async (userId, query = {}) => {
  const patient = await getPatient(userId);
  const { page, limit, skip } = parsePagination(query, { limit: 20 });
  
  const filter = { patient: patient._id };
  
  // Run count and find in parallel
  const [total, savedMedicines] = await Promise.all([
    SavedMedicine.countDocuments(filter),
    SavedMedicine.find(filter)
      .populate({
        ...MEDICINE_POPULATE,
        match: { isActive: true, visibility: true }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
  ]);
  
  // Filter out null medicines (deleted/inactive)
  const validSavedMedicines = savedMedicines.filter(item => item.medicine !== null);
  
  return {
    savedMedicines: validSavedMedicines,
    pagination: buildPaginationResponse(total, page, limit)
  };
};

/**
 * Check if medicine is saved
 */
exports.isMedicineSaved = async (userId, medicineId) => {
  const patient = await getPatient(userId);
  
  const isSaved = await SavedMedicine.exists({
    patient: patient._id,
    medicine: medicineId
  });
  
  return { isSaved: !!isSaved };
};
