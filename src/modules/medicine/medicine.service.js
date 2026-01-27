/**
 * Medicine Service - Refactored with helpers for optimized queries
 * Maintains exact same API responses for backward compatibility
 */

const Medicine = require('../../models/Medicine.model');
const HealthCategory = require('../../models/HealthCategory.model');
const AppError = require('../../utils/AppError');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const { parsePagination, buildPaginationResponse } = require('../../helpers/pagination.helper');
const {
  parseIfString,
  normalizeUsage,
  parseBoolean,
  populateSubCategory,
  batchPopulateSubCategory,
  validateHealthCategory,
  processImages,
  buildMedicineFilter,
  buildMedicineSort,
  calculateStockStatus,
  isValidStatus,
  buildMedicineData,
  applyMedicineUpdates,
  calculateSimilarityScore,
  ensureValidObjectId,
  HEALTH_CATEGORY_POPULATE,
  HEALTH_CATEGORY_POPULATE_ALL
} = require('../../helpers/medicine.helper');

// ============ BULK CREATE (JSON UPLOAD) ============

/**
 * Bulk add medicines from JSON payload (no file uploads)
 * Expects an array of medicine objects in the correct format
 */
exports.bulkAddMedicinesFromJson = async (medicinesPayload = []) => {
  if (!Array.isArray(medicinesPayload) || medicinesPayload.length === 0) {
    throw new AppError('medicines array is required and cannot be empty', 400);
  }

  const createdMedicines = [];

  for (const data of medicinesPayload) {
    // Map category/subCategory to healthCategory/healthTypeSlug
    const healthCategoryId = data.category || data.healthCategory;
    const healthTypeSlugValue = data.subCategory || data.healthTypeSlug;

    // Validate health category relationship
    const healthCategoryData = await validateHealthCategory(healthCategoryId, healthTypeSlugValue);

    // Process images from JSON body only (no file uploads here)
    const images = processImages(data, [], null);

    // Build medicine data
    const medicineData = buildMedicineData(data, images, healthCategoryData);

    // Create medicine
    const medicine = await Medicine.create(medicineData);

    // Populate healthCategory if exists
    if (medicine.healthCategory) {
      await medicine.populate(HEALTH_CATEGORY_POPULATE_ALL);
    }

    // Convert to plain object and populate subCategory
    let medicineObj = medicine.toObject();
    medicineObj = await populateSubCategory(medicineObj);

    createdMedicines.push(medicineObj);
  }

  return createdMedicines;
};

// ============ CREATE ============

/**
 * Add new medicine
 */
exports.addMedicine = async (data, files = [], req = null) => {
  // Map category/subCategory to healthCategory/healthTypeSlug
  const healthCategoryId = data.category || data.healthCategory;
  const healthTypeSlugValue = data.subCategory || data.healthTypeSlug;

  // Validate health category relationship
  const healthCategoryData = await validateHealthCategory(healthCategoryId, healthTypeSlugValue);

  // Process images from body and files
  const images = processImages(data, files, req);

  // Build medicine data
  const medicineData = buildMedicineData(data, images, healthCategoryData);

  // Create medicine
  const medicine = await Medicine.create(medicineData);
  
  // Populate healthCategory if exists
  if (medicine.healthCategory) {
    await medicine.populate(HEALTH_CATEGORY_POPULATE_ALL);
  }
  
  // Convert to plain object and populate subCategory
  let medicineObj = medicine.toObject();
  medicineObj = await populateSubCategory(medicineObj);
  
  return medicineObj;
};

// ============ READ ============

/**
 * Get all medicines with optimized queries
 */
exports.getAllMedicines = async (query = {}) => {
  // Parse pagination
  const { page, limit, skip } = parsePagination(query);
  
  // Build filter and sort
  const filter = buildMedicineFilter(query);
  const sort = buildMedicineSort(query);

  // Execute count and find in parallel for better performance
  const [total, medicines] = await Promise.all([
    Medicine.countDocuments(filter),
    Medicine.find(filter)
      .populate(HEALTH_CATEGORY_POPULATE)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  // Batch populate subCategory (optimized - single query for all categories)
  const medicinesWithSubCategory = await batchPopulateSubCategory(medicines);

  return {
    medicines: medicinesWithSubCategory,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get medicine by ID
 */
exports.getMedicineById = async (medicineId) => {
  ensureValidObjectId(medicineId, 'medicine ID');

  let medicine = await Medicine.findById(medicineId)
    .populate(HEALTH_CATEGORY_POPULATE_ALL)
    .lean();
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }
  
  // Populate subCategory
  medicine = await populateSubCategory(medicine);
  
  return medicine;
};

/**
 * Find similar medicines (optimized)
 */
exports.findSimilarMedicines = async (medicineId, options = {}) => {
  const limit = parseInt(options.limit) || 10;
  
  // Get the original medicine
  const originalMedicine = await Medicine.findOne({ 
    _id: medicineId, 
    isActive: true,
    visibility: true 
  }).lean();
  
  if (!originalMedicine) {
    throw new AppError('Medicine not found', 404);
  }
  
  // Build similarity criteria
  const similarityCriteria = [];
  
  if (originalMedicine.healthCategory) {
    similarityCriteria.push({
      healthCategory: originalMedicine.healthCategory,
      _id: { $ne: medicineId }
    });
  }
  
  if (originalMedicine.healthTypeSlug) {
    similarityCriteria.push({
      healthTypeSlug: originalMedicine.healthTypeSlug,
      _id: { $ne: medicineId }
    });
  }
  
  if (originalMedicine.category) {
    similarityCriteria.push({
      category: originalMedicine.category,
      _id: { $ne: medicineId }
    });
  }
  
  if (originalMedicine.generics && originalMedicine.generics.length > 0) {
    similarityCriteria.push({
      generics: { $in: originalMedicine.generics },
      _id: { $ne: medicineId }
    });
  }
  
  if (originalMedicine.brand) {
    similarityCriteria.push({
      brand: originalMedicine.brand,
      _id: { $ne: medicineId }
    });
  }
  
  // If no criteria found, return empty
  if (similarityCriteria.length === 0) {
    return {
      medicines: [],
      pagination: { page: 1, limit, total: 0, pages: 0 }
    };
  }
  
  // Build base filter
  const filter = {
    _id: { $ne: medicineId },
    isActive: true,
    visibility: true,
    status: { $in: ['in_stock', 'low_stock'] },
    $or: similarityCriteria
  };
  
  // Find similar medicines
  const medicines = await Medicine.find(filter)
    .populate(HEALTH_CATEGORY_POPULATE)
    .lean();
  
  // Score and sort by similarity
  const scoredMedicines = medicines.map(medicine => ({
    ...medicine,
    similarityScore: calculateSimilarityScore(medicine, originalMedicine)
  }));
  
  // Sort by score (desc) then price (asc)
  scoredMedicines.sort((a, b) => {
    if (b.similarityScore !== a.similarityScore) {
      return b.similarityScore - a.similarityScore;
    }
    return a.salePrice - b.salePrice;
  });
  
  // Limit and remove score
  const finalMedicines = scoredMedicines
    .slice(0, limit)
    .map(({ similarityScore, ...medicine }) => medicine);
  
  return {
    medicines: finalMedicines,
    pagination: { page: 1, limit, total: finalMedicines.length, pages: 1 }
  };
};

// ============ UPDATE ============

/**
 * Update medicine
 */
exports.updateMedicine = async (medicineId, data, files = [], req = null) => {
  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  // Map category/subCategory to healthCategory/healthTypeSlug
  const healthCategoryId = data.category || data.healthCategory;
  const healthTypeSlugValue = data.subCategory !== undefined ? data.subCategory : (data.healthTypeSlug !== undefined ? data.healthTypeSlug : undefined);

  // Validate relationship
  if (healthTypeSlugValue !== undefined && !healthCategoryId && !medicine.healthCategory) {
    throw new AppError('Category is required when subCategory is provided', 400);
  }

  // Validate health category if provided
  let healthCategoryData = null;
  const healthCategoryToValidate = healthCategoryId || (healthTypeSlugValue !== undefined ? medicine.healthCategory : null);
  
  if (healthCategoryToValidate) {
    healthCategoryData = await validateHealthCategory(healthCategoryToValidate, healthTypeSlugValue || medicine.healthTypeSlug);
  }

  // Process images (handle both JSON and file uploads)
  let images = null;
  if (data.images !== undefined || (files && files.length > 0)) {
    images = processImages(data, files, req, medicine.images);
  }

  // Apply updates
  applyMedicineUpdates(medicine, data, images, healthCategoryData);

  // Handle subCategory update without category change
  if (data.subCategory && !healthCategoryId && medicine.healthCategory) {
    const healthCategory = await HealthCategory.findById(medicine.healthCategory);
    if (healthCategory) {
      const isObjectId = mongoose.Types.ObjectId.isValid(data.subCategory);
      let typeFound = null;
      
      if (isObjectId) {
        typeFound = healthCategory.types.find(
          type => type._id && type._id.toString() === data.subCategory && type.isActive
        );
      } else {
        typeFound = healthCategory.types.find(
          type => type.slug === data.subCategory && type.isActive
        );
      }
      
      if (!typeFound) {
        const availableSlugs = healthCategory.types.filter(t => t.isActive).map(t => t.slug).join(', ');
        throw new AppError(`SubCategory "${data.subCategory}" not found in the current category "${healthCategory.name}". Available subCategories: ${availableSlugs}`, 404);
      }
      medicine.healthTypeSlug = isObjectId ? typeFound.slug : data.subCategory;
      medicine.healthTypeId = typeFound._id;
    }
  }

  await medicine.save();
  
  // Populate healthCategory
  if (medicine.healthCategory) {
    await medicine.populate(HEALTH_CATEGORY_POPULATE_ALL);
  }
  
  // Convert and populate subCategory
  let medicineObj = medicine.toObject();
  medicineObj = await populateSubCategory(medicineObj);
  
  return medicineObj;
};

/**
 * Update medicine stock and status
 */
exports.updateMedicineStockStatus = async (medicineId, data) => {
  ensureValidObjectId(medicineId, 'medicine ID');

  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  // Update stock
  if (data.stock !== undefined) {
    medicine.stock = parseInt(data.stock);
    
    // Auto-update status if not explicitly provided
    if (data.status === undefined) {
      medicine.status = calculateStockStatus(medicine.stock);
    }
  }

  // Update status if explicitly provided
  if (data.status !== undefined) {
    if (!isValidStatus(data.status)) {
      throw new AppError(`Invalid status. Must be one of: in_stock, low_stock, out_of_stock, discontinued`, 400);
    }
    medicine.status = data.status;
  }

  await medicine.save();

  logger.info('Medicine stock and status updated', {
    medicineId: medicine._id,
    productName: medicine.productName,
    stock: medicine.stock,
    status: medicine.status
  });

  // Populate healthCategory
  if (medicine.healthCategory) {
    await medicine.populate(HEALTH_CATEGORY_POPULATE_ALL);
  }

  return medicine;
};

/**
 * Update medicine visibility
 */
exports.updateMedicineVisibility = async (medicineId, visibility) => {
  ensureValidObjectId(medicineId, 'medicine ID');

  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  if (visibility === undefined) {
    throw new AppError('Visibility value is required', 400);
  }

  // Preserve isActive
  const wasActive = medicine.isActive;
  
  // Update visibility using direct update to prevent side effects
  await Medicine.updateOne(
    { _id: medicineId },
    { 
      $set: { 
        visibility: parseBoolean(visibility),
        isActive: wasActive !== undefined ? wasActive : true
      }
    }
  );

  logger.info('Medicine visibility updated', {
    medicineId: medicine._id,
    productName: medicine.productName,
    visibility: parseBoolean(visibility),
    isActive: wasActive
  });

  // Fetch updated medicine with all fields
  const updatedMedicine = await Medicine.findById(medicineId)
    .select('_id productName brand originalPrice salePrice images description generics dosageOptions quantityOptions category stock status visibility isActive healthCategory healthTypeSlug isTrendy isBestOffer discountPercentage views createdAt updatedAt')
    .lean();

  // Populate healthCategory
  if (updatedMedicine && updatedMedicine.healthCategory) {
    const healthCategory = await HealthCategory.findById(updatedMedicine.healthCategory).lean();
    if (healthCategory) {
      updatedMedicine.healthCategory = healthCategory;
    }
  }

  return updatedMedicine || medicine.toObject();
};

// ============ DELETE ============

/**
 * Delete medicine (soft delete)
 */
exports.deleteMedicine = async (medicineId) => {
  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  medicine.isActive = false;
  await medicine.save();
  
  return { message: 'Medicine deleted successfully' };
};
