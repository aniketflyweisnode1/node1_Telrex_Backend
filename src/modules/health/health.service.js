/**
 * Health Service - Refactored with helpers for optimized queries
 * Maintains exact same API responses for backward compatibility
 */

const HealthCategory = require('../../models/HealthCategory.model');
const Medicine = require('../../models/Medicine.model');
const AppError = require('../../utils/AppError');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const {
  CATEGORY_USER_POPULATE,
  MEDICINE_HEALTH_CATEGORY_POPULATE,
  MEDICINE_HEALTH_CATEGORY_FULL_POPULATE,
  ensureValidObjectId,
  isValidObjectId,
  buildCategoryFilter,
  buildMedicationFilter,
  buildFeaturedMedicationFilter,
  buildCategorySort,
  buildMedicationSort,
  filterActiveTypes,
  filterActiveTypesForCategories,
  sortTypesByOrder,
  addDiscountAndSort,
  extractCategorySummary,
  updateMedicineFlag,
  checkDuplicateCategory,
  parsePagination,
  buildPaginationResponse
} = require('../../helpers/health.helper');

// ============ HEALTH CATEGORY CRUD ============

/**
 * Get all health categories (optimized with parallel queries)
 */
exports.getAllHealthCategories = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query, { page: 1, limit: 100 });
  const filter = buildCategoryFilter(query);
  const sort = buildCategorySort(query);

  // Parallel execution for better performance
  const [categories, total] = await Promise.all([
    HealthCategory.find(filter)
      .populate(CATEGORY_USER_POPULATE[0])
      .populate(CATEGORY_USER_POPULATE[1])
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    HealthCategory.countDocuments(filter)
  ]);

  // Filter active types
  const categoriesWithActiveTypes = filterActiveTypesForCategories(categories);

  return {
    categories: categoriesWithActiveTypes,
    pagination: buildPaginationResponse(total, page, limit)
  };
};

/**
 * Get health category by ID
 */
exports.getHealthCategoryById = async (categoryId) => {
  ensureValidObjectId(categoryId, 'health category ID');

  const category = await HealthCategory.findById(categoryId)
    .populate(CATEGORY_USER_POPULATE[0])
    .populate(CATEGORY_USER_POPULATE[1])
    .lean();

  if (!category) {
    throw new AppError('Health category not found', 404);
  }

  return filterActiveTypes(category);
};

/**
 * Get health category by slug
 */
exports.getHealthCategoryBySlug = async (slug) => {
  const category = await HealthCategory.findOne({ slug, isActive: true })
    .populate(CATEGORY_USER_POPULATE[0])
    .populate(CATEGORY_USER_POPULATE[1])
    .lean();

  if (!category) {
    throw new AppError('Health category not found', 404);
  }

  return filterActiveTypes(category);
};

/**
 * Get types (chronic conditions) for a category
 */
exports.getCategoryTypes = async (categoryId) => {
  ensureValidObjectId(categoryId, 'health category ID');

  const category = await HealthCategory.findById(categoryId).lean();

  if (!category) {
    throw new AppError('Health category not found', 404);
  }

  // Filter active types and sort by order
  const activeTypes = category.types ? category.types.filter(type => type.isActive !== false) : [];
  const sortedTypes = sortTypesByOrder(activeTypes);

  return {
    category: extractCategorySummary(category),
    types: sortedTypes
  };
};

/**
 * Create health category
 */
exports.createHealthCategory = async (data, userId) => {
  await checkDuplicateCategory(HealthCategory, data.name, data.slug);

  const categoryData = {
    ...data,
    createdBy: userId,
    updatedBy: userId
  };

  const category = await HealthCategory.create(categoryData);

  logger.info('Health category created', {
    categoryId: category._id,
    name: category.name,
    createdBy: userId
  });

  return await HealthCategory.findById(category._id)
    .populate(CATEGORY_USER_POPULATE[0])
    .populate(CATEGORY_USER_POPULATE[1])
    .lean();
};

/**
 * Bulk create health categories from JSON payload
 */
exports.bulkCreateHealthCategories = async (categoriesPayload = [], userId) => {
  if (!Array.isArray(categoriesPayload) || categoriesPayload.length === 0) {
    throw new AppError('categories array is required and cannot be empty', 400);
  }

  const seenNames = new Set();
  const seenSlugs = new Set();
  const createdCategories = [];

  for (const data of categoriesPayload) {
    // In-payload duplicate guard
    if (data.name) {
      if (seenNames.has(data.name)) {
        throw new AppError(`Duplicate category name in payload: ${data.name}`, 400);
      }
      seenNames.add(data.name);
    }
    if (data.slug) {
      if (seenSlugs.has(data.slug)) {
        throw new AppError(`Duplicate category slug in payload: ${data.slug}`, 400);
      }
      seenSlugs.add(data.slug);
    }

    // DB-level duplicate check
    await checkDuplicateCategory(HealthCategory, data.name, data.slug);

    const categoryData = {
      ...data,
      createdBy: userId,
      updatedBy: userId
    };

    const category = await HealthCategory.create(categoryData);

    const populatedCategory = await HealthCategory.findById(category._id)
      .populate(CATEGORY_USER_POPULATE[0])
      .populate(CATEGORY_USER_POPULATE[1])
      .lean();

    createdCategories.push(populatedCategory);
  }

  return createdCategories;
};

/**
 * Update health category
 */
exports.updateHealthCategory = async (categoryId, data, userId) => {
  ensureValidObjectId(categoryId, 'health category ID');

  const category = await HealthCategory.findById(categoryId);
  
  if (!category) {
    throw new AppError('Health category not found', 404);
  }

  // Check for duplicates (excluding current category)
  if (data.name || data.slug) {
    await checkDuplicateCategory(
      HealthCategory, 
      data.name || category.name, 
      data.slug || category.slug, 
      categoryId
    );
  }

  // Update fields (exclude createdBy)
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && key !== 'createdBy') {
      category[key] = data[key];
    }
  });

  category.updatedBy = userId;
  await category.save();

  logger.info('Health category updated', {
    categoryId: category._id,
    name: category.name,
    updatedBy: userId
  });

  return await HealthCategory.findById(category._id)
    .populate(CATEGORY_USER_POPULATE[0])
    .populate(CATEGORY_USER_POPULATE[1])
    .lean();
};

/**
 * Delete health category (soft delete)
 */
exports.deleteHealthCategory = async (categoryId) => {
  ensureValidObjectId(categoryId, 'health category ID');

  const category = await HealthCategory.findById(categoryId);
  
  if (!category) {
    throw new AppError('Health category not found', 404);
  }

  category.isActive = false;
  await category.save();

  logger.info('Health category deleted', {
    categoryId: category._id,
    name: category.name
  });

  return { message: 'Health category deleted successfully' };
};

/**
 * Activate health category
 */
exports.activateHealthCategory = async (categoryId, userId) => {
  ensureValidObjectId(categoryId, 'health category ID');

  const category = await HealthCategory.findById(categoryId);
  
  if (!category) {
    throw new AppError('Health category not found', 404);
  }

  category.isActive = true;
  category.updatedBy = userId;
  await category.save();

  logger.info('Health category activated', {
    categoryId: category._id,
    name: category.name,
    updatedBy: userId
  });

  return await HealthCategory.findById(category._id)
    .populate(CATEGORY_USER_POPULATE[0])
    .populate(CATEGORY_USER_POPULATE[1])
    .lean();
};

/**
 * Deactivate health category
 */
exports.deactivateHealthCategory = async (categoryId, userId) => {
  ensureValidObjectId(categoryId, 'health category ID');

  const category = await HealthCategory.findById(categoryId);
  
  if (!category) {
    throw new AppError('Health category not found', 404);
  }

  category.isActive = false;
  category.updatedBy = userId;
  await category.save();

  logger.info('Health category deactivated', {
    categoryId: category._id,
    name: category.name,
    updatedBy: userId
  });

  return await HealthCategory.findById(category._id)
    .populate(CATEGORY_USER_POPULATE[0])
    .populate(CATEGORY_USER_POPULATE[1])
    .lean();
};

// ============ MEDICATIONS ============

/**
 * Get medications by health category ID (optimized)
 */
exports.getMedicationsByCategoryId = async (categoryId, query = {}) => {
  ensureValidObjectId(categoryId, 'health category ID');

  // Verify category exists
  const category = await HealthCategory.findById(categoryId).lean();
  if (!category) {
    throw new AppError('Health category not found', 404);
  }

  const { page, limit, skip } = parsePagination(query, { page: 1, limit: 20 });
  const filter = buildMedicationFilter(query, { categoryId });
  const sort = buildMedicationSort(query);

  // Parallel queries
  const [medications, total] = await Promise.all([
    Medicine.find(filter)
      .populate(MEDICINE_HEALTH_CATEGORY_POPULATE)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Medicine.countDocuments(filter)
  ]);

  return {
    category: extractCategorySummary(category),
    medications,
    pagination: buildPaginationResponse(total, page, limit)
  };
};

/**
 * Get medications with filters (optimized)
 */
exports.getMedications = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query, { page: 1, limit: 20 });
  const filter = buildMedicationFilter(query);
  const sort = buildMedicationSort(query);

  // Parallel queries
  const [medications, total] = await Promise.all([
    Medicine.find(filter)
      .populate(MEDICINE_HEALTH_CATEGORY_POPULATE)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Medicine.countDocuments(filter)
  ]);

  return {
    medications,
    pagination: buildPaginationResponse(total, page, limit)
  };
};

/**
 * Get trendy medications
 */
exports.getTrendyMedications = async (query = {}) => {
  const limit = parseInt(query.limit) || 10;
  const filter = buildFeaturedMedicationFilter(query, 'isTrendy');

  const medications = await Medicine.find(filter)
    .populate(MEDICINE_HEALTH_CATEGORY_POPULATE)
    .sort({ views: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return { medications };
};

/**
 * Get best offers (with discount calculation)
 */
exports.getBestOffers = async (query = {}) => {
  const limit = parseInt(query.limit) || 10;
  const filter = buildFeaturedMedicationFilter(query, 'isBestOffer');

  const medications = await Medicine.find(filter)
    .populate(MEDICINE_HEALTH_CATEGORY_POPULATE)
    .lean();

  // Calculate discount and sort
  const sortedMedications = addDiscountAndSort(medications);

  return {
    medications: sortedMedications.slice(0, limit)
  };
};

// ============ MEDICINE FLAGS ============

/**
 * Mark medicine as trendy
 */
exports.markMedicineAsTrendy = async (medicineId, userId) => {
  logger.info('Mark trendy request received', { medicineId, userId });

  ensureValidObjectId(medicineId, 'medicine ID');

  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    logger.warn('Medicine not found', { medicineId });
    throw new AppError('Medicine not found', 404);
  }

  logger.info('Medicine found', {
    medicineId: medicine._id,
    productName: medicine.productName,
    currentIsTrendy: medicine.isTrendy
  });

  medicine.isTrendy = true;
  await medicine.save();

  logger.info('Medicine marked as trendy successfully', {
    medicineId: medicine._id,
    productName: medicine.productName,
    updatedBy: userId
  });

  const updatedMedicine = await Medicine.findById(medicine._id)
    .populate(MEDICINE_HEALTH_CATEGORY_POPULATE)
    .lean();

  return updatedMedicine;
};

/**
 * Unmark medicine as trendy
 */
exports.unmarkMedicineAsTrendy = async (medicineId, userId) => {
  logger.info('Unmark trendy request received', { medicineId, userId });

  ensureValidObjectId(medicineId, 'medicine ID');

  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    logger.warn('Medicine not found', { medicineId });
    throw new AppError('Medicine not found', 404);
  }

  medicine.isTrendy = false;
  await medicine.save();

  logger.info('Medicine unmarked as trendy successfully', {
    medicineId: medicine._id,
    productName: medicine.productName,
    updatedBy: userId
  });

  return await Medicine.findById(medicine._id)
    .populate(MEDICINE_HEALTH_CATEGORY_POPULATE)
    .lean();
};

/**
 * Mark medicine as best offer
 */
exports.markMedicineAsBestOffer = async (medicineId, data, userId) => {
  logger.info('Mark best offer request received', {
    medicineId,
    hasData: !!data,
    discountPercentage: data?.discountPercentage,
    userId
  });

  ensureValidObjectId(medicineId, 'medicine ID');

  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    logger.warn('Medicine not found', { medicineId });
    throw new AppError('Medicine not found', 404);
  }

  // Update flag with optional discount
  updateMedicineFlag(medicine, 'isBestOffer', true, data || {});
  await medicine.save();

  logger.info('Medicine marked as best offer successfully', {
    medicineId: medicine._id,
    productName: medicine.productName,
    discountPercentage: medicine.discountPercentage,
    updatedBy: userId
  });

  return await Medicine.findById(medicine._id)
    .populate(MEDICINE_HEALTH_CATEGORY_POPULATE)
    .lean();
};

/**
 * Unmark medicine as best offer
 */
exports.unmarkMedicineAsBestOffer = async (medicineId, userId) => {
  logger.info('Unmark best offer request received', { medicineId, userId });

  ensureValidObjectId(medicineId, 'medicine ID');

  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    logger.warn('Medicine not found', { medicineId });
    throw new AppError('Medicine not found', 404);
  }

  medicine.isBestOffer = false;
  await medicine.save();

  logger.info('Medicine unmarked as best offer successfully', {
    medicineId: medicine._id,
    productName: medicine.productName,
    updatedBy: userId
  });

  return await Medicine.findById(medicine._id)
    .populate(MEDICINE_HEALTH_CATEGORY_POPULATE)
    .lean();
};

/**
 * Update medicine health category and type
 */
exports.updateMedicineHealthRelation = async (medicineId, data, userId) => {
  ensureValidObjectId(medicineId, 'medicine ID');

  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  // Validate healthCategory if provided
  if (data.healthCategory) {
    ensureValidObjectId(data.healthCategory, 'health category ID');

    const healthCategory = await HealthCategory.findById(data.healthCategory);
    if (!healthCategory || !healthCategory.isActive) {
      throw new AppError('Health category not found or inactive', 404);
    }

    medicine.healthCategory = data.healthCategory;
  }

  // Validate healthTypeSlug if provided
  if (data.healthTypeSlug) {
    if (medicine.healthCategory) {
      const healthCategory = await HealthCategory.findById(medicine.healthCategory);
      if (healthCategory) {
        const typeExists = healthCategory.types.some(
          type => type.slug === data.healthTypeSlug && type.isActive
        );
        if (!typeExists) {
          throw new AppError('Health type not found in the selected category', 404);
        }
      }
    }
    medicine.healthTypeSlug = data.healthTypeSlug;
  }

  await medicine.save();

  logger.info('Medicine health relation updated', {
    medicineId: medicine._id,
    productName: medicine.productName,
    healthCategory: medicine.healthCategory,
    healthTypeSlug: medicine.healthTypeSlug,
    updatedBy: userId
  });

  return await Medicine.findById(medicine._id)
    .populate(MEDICINE_HEALTH_CATEGORY_FULL_POPULATE)
    .lean();
};
