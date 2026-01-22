/**
 * Health Category Helper - Shared utilities for health category operations
 * All helper functions maintain existing API responses exactly
 */

const mongoose = require('mongoose');
const AppError = require('../utils/AppError');

// ============ POPULATE OPTIONS ============

const CATEGORY_USER_POPULATE = [
  { path: 'createdBy', select: 'firstName lastName email' },
  { path: 'updatedBy', select: 'firstName lastName email' }
];

const MEDICINE_HEALTH_CATEGORY_POPULATE = {
  path: 'healthCategory',
  select: 'name slug description icon',
  match: { isActive: true }
};

const MEDICINE_HEALTH_CATEGORY_FULL_POPULATE = {
  path: 'healthCategory',
  select: 'name slug description icon types'
};

// ============ VALIDATION HELPERS ============

/**
 * Validate ObjectId and throw if invalid
 * @param {string} id - ID to validate
 * @param {string} fieldName - Field name for error message
 */
const ensureValidObjectId = (id, fieldName = 'ID') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

/**
 * Check if ID is valid ObjectId
 * @param {string} id - ID to check
 * @returns {boolean}
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// ============ FILTER HELPERS ============

/**
 * Build filter for health category queries
 * @param {Object} query - Request query params
 * @returns {Object} MongoDB filter
 */
const buildCategoryFilter = (query = {}) => {
  const { search, isActive } = query;
  const filter = {};

  // Search filter
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Active filter
  if (isActive !== undefined) {
    filter.isActive = isActive === 'true' || isActive === true;
  } else {
    // Default: only active categories
    filter.isActive = true;
  }

  return filter;
};

/**
 * Build filter for medication queries
 * @param {Object} query - Request query params
 * @param {Object} options - Additional options { categoryId }
 * @returns {Object} MongoDB filter
 */
const buildMedicationFilter = (query = {}, options = {}) => {
  const {
    search,
    category,
    healthCategoryId,
    healthTypeSlug,
    minPrice,
    maxPrice,
    status,
    inStock
  } = query;

  const filter = {
    isActive: true,
    visibility: true
  };

  // Category ID from options (for getMedicationsByCategoryId)
  if (options.categoryId) {
    filter.healthCategory = options.categoryId;
  }

  // Search filter
  if (search) {
    filter.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { generics: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Category filter (medicine category)
  if (category) {
    filter.category = { $regex: category, $options: 'i' };
  }

  // Health category filter
  if (healthCategoryId && isValidObjectId(healthCategoryId)) {
    filter.healthCategory = healthCategoryId;
  }

  // Health type filter
  if (healthTypeSlug) {
    filter.healthTypeSlug = healthTypeSlug;
  }

  // Price filters
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.salePrice = {};
    if (minPrice !== undefined) {
      filter.salePrice.$gte = parseFloat(minPrice);
    }
    if (maxPrice !== undefined) {
      filter.salePrice.$lte = parseFloat(maxPrice);
    }
  }

  // Status filter
  if (status) {
    filter.status = status;
  }

  // Stock filter - handle $or conflict with search
  if (inStock === 'true' || inStock === true) {
    if (filter.$or) {
      // If we already have $or from search, need to use $and
      filter.$and = [
        { $or: filter.$or },
        { status: { $in: ['in_stock', 'low_stock'] } }
      ];
      delete filter.$or;
    } else {
      filter.status = { $in: ['in_stock', 'low_stock'] };
    }
  }

  return filter;
};

/**
 * Build filter for featured medications (trendy/best offers)
 * @param {Object} query - Request query params
 * @param {string} flagField - 'isTrendy' or 'isBestOffer'
 * @returns {Object} MongoDB filter
 */
const buildFeaturedMedicationFilter = (query = {}, flagField) => {
  const { category, healthCategoryId } = query;

  const filter = {
    isActive: true,
    visibility: true,
    status: { $in: ['in_stock', 'low_stock'] },
    [flagField]: true
  };

  if (category) {
    filter.category = { $regex: category, $options: 'i' };
  }

  if (healthCategoryId && isValidObjectId(healthCategoryId)) {
    filter.healthCategory = healthCategoryId;
  }

  return filter;
};

// ============ SORT HELPERS ============

/**
 * Build sort for category queries
 * @param {Object} query - Request query params
 * @returns {Object} MongoDB sort
 */
const buildCategorySort = (query = {}) => {
  const { sortBy = 'order', sortOrder = 'asc' } = query;
  return { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
};

/**
 * Build sort for medication queries
 * @param {Object} query - Request query params
 * @returns {Object} MongoDB sort
 */
const buildMedicationSort = (query = {}) => {
  const { sortBy = 'createdAt', sortOrder = 'desc' } = query;
  return { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
};

// ============ DATA PROCESSING HELPERS ============

/**
 * Filter active types from category
 * @param {Object} category - Category object
 * @returns {Object} Category with filtered types
 */
const filterActiveTypes = (category) => {
  if (!category) return category;
  
  return {
    ...category,
    types: category.types ? category.types.filter(type => type.isActive !== false) : []
  };
};

/**
 * Filter active types for multiple categories
 * @param {Array} categories - Array of category objects
 * @returns {Array} Categories with filtered types
 */
const filterActiveTypesForCategories = (categories) => {
  if (!categories || !Array.isArray(categories)) return [];
  return categories.map(filterActiveTypes);
};

/**
 * Sort types by order
 * @param {Array} types - Array of type objects
 * @returns {Array} Sorted types
 */
const sortTypesByOrder = (types) => {
  if (!types || !Array.isArray(types)) return [];
  return types.sort((a, b) => (a.order || 0) - (b.order || 0));
};

/**
 * Calculate discount for medication
 * @param {Object} medicine - Medicine object
 * @returns {number} Discount percentage (rounded to 2 decimals)
 */
const calculateDiscount = (medicine) => {
  let discount = 0;
  
  if (medicine.discountPercentage !== null && medicine.discountPercentage !== undefined) {
    discount = medicine.discountPercentage;
  } else if (medicine.originalPrice > 0) {
    discount = ((medicine.originalPrice - medicine.salePrice) / medicine.originalPrice) * 100;
  }
  
  return Math.round(discount * 100) / 100;
};

/**
 * Add discount to medications array and sort by discount
 * @param {Array} medications - Array of medication objects
 * @returns {Array} Medications with discount, sorted
 */
const addDiscountAndSort = (medications) => {
  if (!medications || !Array.isArray(medications)) return [];
  
  const withDiscount = medications.map(med => ({
    ...med,
    discount: calculateDiscount(med)
  }));
  
  // Sort by discount (highest first), then by views
  withDiscount.sort((a, b) => {
    if (b.discount !== a.discount) {
      return b.discount - a.discount;
    }
    return (b.views || 0) - (a.views || 0);
  });
  
  return withDiscount;
};

/**
 * Extract category summary for response
 * @param {Object} category - Full category object
 * @returns {Object} Category summary
 */
const extractCategorySummary = (category) => {
  if (!category) return null;
  
  return {
    _id: category._id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    icon: category.icon
  };
};

// ============ MEDICINE FLAG HELPERS ============

/**
 * Update medicine flag (trendy/bestOffer)
 * @param {Object} medicine - Medicine document
 * @param {string} flagField - Field to update
 * @param {boolean} value - New value
 * @param {Object} additionalData - Additional data to set
 */
const updateMedicineFlag = (medicine, flagField, value, additionalData = {}) => {
  medicine[flagField] = value;
  
  // Handle additional data for best offer
  if (additionalData.discountPercentage !== undefined) {
    if (additionalData.discountPercentage < 0 || additionalData.discountPercentage > 100) {
      throw new AppError('Discount percentage must be between 0 and 100', 400);
    }
    medicine.discountPercentage = additionalData.discountPercentage;
  }
  
  return medicine;
};

// ============ DUPLICATE CHECK HELPERS ============

/**
 * Check for duplicate category name/slug
 * @param {Object} HealthCategory - HealthCategory model
 * @param {string} name - Category name
 * @param {string} slug - Category slug
 * @param {string} excludeId - ID to exclude (for updates)
 */
const checkDuplicateCategory = async (HealthCategory, name, slug, excludeId = null) => {
  const orConditions = [];
  if (name) orConditions.push({ name });
  if (slug) orConditions.push({ slug });
  
  if (orConditions.length === 0) return;
  
  const filter = { $or: orConditions };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  
  const existing = await HealthCategory.findOne(filter);
  if (existing) {
    throw new AppError('Health category with this name or slug already exists', 409);
  }
};

// ============ PAGINATION HELPERS ============

/**
 * Parse pagination from query
 * @param {Object} query - Request query
 * @param {Object} defaults - Default values
 * @returns {Object} { page, limit, skip }
 */
const parsePagination = (query = {}, defaults = { page: 1, limit: 100 }) => {
  const page = Math.max(1, parseInt(query.page) || defaults.page);
  const limit = Math.min(1000, Math.max(1, parseInt(query.limit) || defaults.limit));
  const skip = (page - 1) * limit;
  
  return { page, limit, skip };
};

/**
 * Build pagination response
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const buildPaginationResponse = (total, page, limit) => {
  return {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  };
};

module.exports = {
  // Populate options
  CATEGORY_USER_POPULATE,
  MEDICINE_HEALTH_CATEGORY_POPULATE,
  MEDICINE_HEALTH_CATEGORY_FULL_POPULATE,
  
  // Validation
  ensureValidObjectId,
  isValidObjectId,
  
  // Filters
  buildCategoryFilter,
  buildMedicationFilter,
  buildFeaturedMedicationFilter,
  
  // Sorting
  buildCategorySort,
  buildMedicationSort,
  
  // Data processing
  filterActiveTypes,
  filterActiveTypesForCategories,
  sortTypesByOrder,
  calculateDiscount,
  addDiscountAndSort,
  extractCategorySummary,
  
  // Medicine flags
  updateMedicineFlag,
  
  // Duplicate check
  checkDuplicateCategory,
  
  // Pagination
  parsePagination,
  buildPaginationResponse
};

