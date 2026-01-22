/**
 * Medicine Helper - Shared utilities for medicine-related operations
 * All helper functions maintain existing API responses exactly
 */

const mongoose = require('mongoose');
const HealthCategory = require('../models/HealthCategory.model');
const AppError = require('../utils/AppError');

// ============ JSON/DATA PARSING HELPERS ============

/**
 * Parse JSON string if needed (form data often sends JSON as string)
 * @param {any} value - Value to parse
 * @returns {any} Parsed value or original
 */
const parseIfString = (value) => {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }
  return value;
};

/**
 * Normalize usage array (handle both old object format and new string format)
 * @param {Array} usage - Usage array
 * @returns {Array} Normalized string array
 */
const normalizeUsage = (usage) => {
  if (!usage || !Array.isArray(usage)) {
    return [];
  }
  
  return usage.map(item => {
    // Already a string - return trimmed
    if (typeof item === 'string') {
      return item.trim();
    }
    // Object format (old) - convert to string
    if (typeof item === 'object' && item !== null) {
      if (item.title && item.description) {
        return `${item.title}: ${item.description}`;
      }
      if (item.description) return item.description;
      if (item.title) return item.title;
    }
    return String(item);
  }).filter(item => item && item.trim().length > 0);
};

/**
 * Parse boolean from string/boolean
 * @param {any} value - Value to parse
 * @param {boolean} defaultValue - Default if undefined
 * @returns {boolean}
 */
const parseBoolean = (value, defaultValue = false) => {
  if (value === undefined) return defaultValue;
  return value === 'true' || value === true;
};

// ============ HEALTH CATEGORY HELPERS ============

/**
 * Populate subCategory (type) from healthCategory
 * @param {Object} medicine - Medicine object (lean)
 * @returns {Object} Medicine with populated subCategory
 */
const populateSubCategory = async (medicine) => {
  if (!medicine.healthCategory || !medicine.healthTypeId) {
    return medicine;
  }

  // If healthCategory is already populated (object), use it directly
  if (typeof medicine.healthCategory === 'object' && medicine.healthCategory.types) {
    const type = medicine.healthCategory.types.find(
      t => t._id && t._id.toString() === medicine.healthTypeId.toString()
    );
    if (type) {
      medicine.subCategory = type;
    }
  } else if (medicine.healthCategory) {
    // If healthCategory is just an ID, fetch it
    const category = await HealthCategory.findById(medicine.healthCategory).lean();
    if (category && category.types) {
      const type = category.types.find(
        t => t._id && t._id.toString() === medicine.healthTypeId.toString()
      );
      if (type) {
        medicine.subCategory = type;
      }
    }
  }
  
  return medicine;
};

/**
 * Batch populate subCategory for multiple medicines
 * Optimized: fetches all categories in one query
 * @param {Array} medicines - Array of medicine objects
 * @returns {Array} Medicines with populated subCategory
 */
const batchPopulateSubCategory = async (medicines) => {
  if (!medicines || medicines.length === 0) return [];
  
  // Collect all unique healthCategory IDs that need fetching
  const categoryIdsToFetch = new Set();
  
  medicines.forEach(m => {
    if (m.healthTypeId && m.healthCategory) {
      // Only fetch if healthCategory is not already populated
      if (typeof m.healthCategory !== 'object' || !m.healthCategory.types) {
        categoryIdsToFetch.add(m.healthCategory.toString());
      }
    }
  });
  
  // Batch fetch categories
  let categoryMap = new Map();
  if (categoryIdsToFetch.size > 0) {
    const categories = await HealthCategory.find({
      _id: { $in: Array.from(categoryIdsToFetch) }
    }).lean();
    categoryMap = new Map(categories.map(c => [c._id.toString(), c]));
  }
  
  // Populate subCategory for each medicine
  return medicines.map(medicine => {
    if (!medicine.healthTypeId) return medicine;
    
    let types = null;
    
    // Get types from already populated healthCategory or from our map
    if (typeof medicine.healthCategory === 'object' && medicine.healthCategory?.types) {
      types = medicine.healthCategory.types;
    } else if (medicine.healthCategory) {
      const category = categoryMap.get(medicine.healthCategory.toString());
      if (category) {
        types = category.types;
      }
    }
    
    // Find the matching type
    if (types) {
      const type = types.find(
        t => t._id && t._id.toString() === medicine.healthTypeId.toString()
      );
      if (type) {
        medicine.subCategory = type;
      }
    }
    
    return medicine;
  });
};

/**
 * Validate healthCategory and healthTypeSlug relationship
 * @param {string} categoryId - Health category ID
 * @param {string} typeSlugOrId - Health type slug or ID
 * @returns {Object} { healthTypeId, healthTypeSlug, healthCategory }
 */
const validateHealthCategory = async (categoryId, typeSlugOrId) => {
  let healthTypeId = null;
  let actualHealthTypeSlug = null;

  if (!categoryId) {
    if (typeSlugOrId) {
      throw new AppError('Category is required when subCategory is provided', 400);
    }
    return { healthTypeId, healthTypeSlug: actualHealthTypeSlug, healthCategory: undefined };
  }

  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid category ID', 400);
  }

  const healthCategory = await HealthCategory.findById(categoryId);
  if (!healthCategory || !healthCategory.isActive) {
    throw new AppError('Category not found or inactive', 404);
  }

  if (typeSlugOrId) {
    const isObjectId = mongoose.Types.ObjectId.isValid(typeSlugOrId);
    let typeFound = null;

    if (isObjectId) {
      // It's a type ID
      typeFound = healthCategory.types.find(
        type => type._id && type._id.toString() === typeSlugOrId && type.isActive
      );
      if (!typeFound) {
        throw new AppError(`SubCategory type ID "${typeSlugOrId}" not found in the selected category "${healthCategory.name}"`, 404);
      }
      healthTypeId = typeFound._id;
      actualHealthTypeSlug = typeFound.slug;
    } else {
      // It's a slug
      typeFound = healthCategory.types.find(
        type => type.slug === typeSlugOrId && type.isActive
      );
      if (!typeFound) {
        const availableSlugs = healthCategory.types.filter(t => t.isActive).map(t => t.slug).join(', ');
        throw new AppError(`SubCategory "${typeSlugOrId}" not found in the selected category "${healthCategory.name}". Available subCategories: ${availableSlugs}`, 404);
      }
      healthTypeId = typeFound._id;
      actualHealthTypeSlug = typeSlugOrId;
    }
  }

  return { healthTypeId, healthTypeSlug: actualHealthTypeSlug, healthCategory: categoryId };
};

// ============ IMAGE HANDLING HELPERS ============

/**
 * Process images from JSON body and file uploads
 * @param {Object} data - Request body data
 * @param {Array} files - Uploaded files
 * @param {Object} req - Request object for URL building
 * @param {Object} existingImages - Existing images (for update)
 * @returns {Object} { thumbnail, gallery }
 */
const processImages = (data, files = [], req = null, existingImages = null) => {
  let imagesData = existingImages || { thumbnail: '', gallery: [] };

  // If images provided in JSON body
  if (data.images !== undefined) {
    const imagesInput = parseIfString(data.images);
    if (typeof imagesInput === 'object' && imagesInput !== null) {
      imagesData = {
        thumbnail: imagesInput.thumbnail || '',
        gallery: Array.isArray(imagesInput.gallery) ? imagesInput.gallery : []
      };
    }
  }

  // If files uploaded
  if (files && files.length > 0) {
    // Check for specific thumbnail file
    const thumbnailFile = files.find(file => 
      file.fieldname === 'thumbnail' || 
      file.originalname.toLowerCase().includes('thumbnail')
    ) || files[0];
    
    // All other files go to gallery
    const galleryFiles = files.filter(file => file !== thumbnailFile);
    
    const buildUrl = (filename) => {
      return req 
        ? `${req.protocol}://${req.get('host')}/uploads/${filename}`
        : `/uploads/${filename}`;
    };
    
    const thumbnailUrl = buildUrl(thumbnailFile.filename);
    const galleryUrls = galleryFiles.map(file => buildUrl(file.filename));
    
    // Update thumbnail if not already set from JSON
    if (!imagesData.thumbnail) {
      imagesData.thumbnail = thumbnailUrl;
    }
    
    // Merge gallery images (avoid duplicates)
    const existingGallery = imagesData.gallery || [];
    imagesData.gallery = [...existingGallery, ...galleryUrls];
  }

  return imagesData;
};

// ============ FILTER & SORT HELPERS ============

/**
 * Build filter object for medicine queries
 * @param {Object} query - Request query params
 * @param {Object} options - Additional options { includeInactive: false }
 * @returns {Object} MongoDB filter
 */
const buildMedicineFilter = (query = {}, options = {}) => {
  const { includeInactive = false } = options;
  const filter = {};
  
  // Active filter (default: only active)
  if (!includeInactive) {
    filter.isActive = true;
  }

  // Search filter
  if (query.search) {
    filter.$or = [
      { productName: { $regex: query.search, $options: 'i' } },
      { brand: { $regex: query.search, $options: 'i' } },
      { category: { $regex: query.search, $options: 'i' } },
      { generics: { $in: [new RegExp(query.search, 'i')] } }
    ];
  }

  // Category filter
  if (query.category) {
    filter.category = query.category;
  }

  // Health category filter
  if (query.healthCategory) {
    if (mongoose.Types.ObjectId.isValid(query.healthCategory)) {
      filter.healthCategory = query.healthCategory;
    }
  }

  // Availability/Status filter
  const { availability, inStock, status } = query;
  if (availability) {
    if (availability === 'in_stock') {
      filter.status = 'in_stock';
    } else if (availability === 'out_of_stock') {
      filter.status = 'out_of_stock';
    } else if (availability === 'low_stock') {
      filter.status = 'low_stock';
    } else if (availability === 'available') {
      filter.status = { $in: ['in_stock', 'low_stock'] };
    }
  } else if (inStock === 'true' || inStock === true) {
    filter.status = { $in: ['in_stock', 'low_stock'] };
  } else if (status) {
    filter.status = status;
  }

  // Visibility filter
  const visibilityValue = query.visibility;
  const includeHidden = query.includeHidden === 'true' || query.includeHidden === true;
  const showAll = query.all === 'true' || query.all === true;
  
  if (visibilityValue === 'all' || includeHidden || showAll) {
    // Show all - no visibility filter
  } else if (visibilityValue === 'true' || visibilityValue === true) {
    filter.visibility = true;
  } else if (visibilityValue === 'false' || visibilityValue === false) {
    filter.visibility = false;
  } else {
    // Default: only visible
    filter.visibility = true;
  }

  // Trendy/Best offer filters
  if (query.isTrendy === 'true' || query.isTrendy === true) {
    filter.isTrendy = true;
  }
  if (query.isBestOffer === 'true' || query.isBestOffer === true) {
    filter.isBestOffer = true;
  }

  return filter;
};

/**
 * Build sort options for medicine queries
 * @param {Object} query - Request query params
 * @returns {Object} MongoDB sort object
 */
const buildMedicineSort = (query = {}) => {
  const { sortBy = 'createdAt', sortOrder = 'desc' } = query;
  const sort = {};

  // Handle common sort options
  if (sortBy === 'price_low' || sortBy === 'price_asc') {
    sort.salePrice = 1;
  } else if (sortBy === 'price_high' || sortBy === 'price_desc') {
    sort.salePrice = -1;
  } else if (sortBy === 'name' || sortBy === 'productName') {
    sort.productName = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'price' || sortBy === 'salePrice') {
    sort.salePrice = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'originalPrice') {
    sort.originalPrice = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'popularity' || sortBy === 'views') {
    sort.views = -1;
  } else {
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  }

  return sort;
};

// ============ STOCK STATUS HELPERS ============

/**
 * Calculate status based on stock level
 * @param {number} stock - Current stock
 * @returns {string} Status value
 */
const calculateStockStatus = (stock) => {
  if (stock === 0) return 'out_of_stock';
  if (stock < 20) return 'low_stock';
  return 'in_stock';
};

/**
 * Validate status value
 * @param {string} status - Status to validate
 * @returns {boolean}
 */
const isValidStatus = (status) => {
  const validStatuses = ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'];
  return validStatuses.includes(status);
};

// ============ MEDICINE DATA BUILDING HELPERS ============

/**
 * Build medicine data object from request body
 * @param {Object} data - Request body
 * @param {Object} images - Processed images
 * @param {Object} healthCategoryData - Validated health category data
 * @returns {Object} Medicine data for creation/update
 */
const buildMedicineData = (data, images, healthCategoryData = {}) => {
  const medicineData = {
    productName: data.productName,
    brand: data.brand,
    originalPrice: parseFloat(data.originalPrice),
    salePrice: parseFloat(data.salePrice),
    images: images,
    usage: normalizeUsage(parseIfString(data.usage)) || [],
    description: data.description || '',
    howItWorks: data.howItWorks || '',
    generics: parseIfString(data.generics) || [],
    dosageOptions: parseIfString(data.dosageOptions) || [],
    quantityOptions: parseIfString(data.quantityOptions) || [],
    precautions: data.precautions || '',
    sideEffects: data.sideEffects || '',
    drugInteractions: data.drugInteractions || '',
    indications: data.indications || '',
    category: data.category || '',
    healthCategory: healthCategoryData.healthCategory || undefined,
    healthTypeSlug: healthCategoryData.healthTypeSlug || undefined,
    healthTypeId: healthCategoryData.healthTypeId || undefined,
    isTrendy: parseBoolean(data.isTrendy, false),
    isBestOffer: parseBoolean(data.isBestOffer, false),
    discountPercentage: data.discountPercentage !== undefined ? parseFloat(data.discountPercentage) : undefined,
    markup: data.markup !== undefined ? parseFloat(data.markup) : 0,
    stock: data.stock ? parseInt(data.stock) : 0,
    status: data.status || undefined,
    visibility: parseBoolean(data.visibility, true)
  };

  // Auto-calculate status if not provided
  if (!medicineData.status && medicineData.stock !== undefined) {
    medicineData.status = calculateStockStatus(medicineData.stock);
  }

  return medicineData;
};

/**
 * Apply updates to existing medicine document
 * @param {Object} medicine - Mongoose document
 * @param {Object} data - Update data
 * @param {Object} images - Processed images (optional)
 * @param {Object} healthCategoryData - Validated health category data (optional)
 */
const applyMedicineUpdates = (medicine, data, images = null, healthCategoryData = null) => {
  // Basic fields
  if (data.productName) medicine.productName = data.productName;
  if (data.brand) medicine.brand = data.brand;
  if (data.originalPrice) medicine.originalPrice = parseFloat(data.originalPrice);
  if (data.salePrice) medicine.salePrice = parseFloat(data.salePrice);
  if (data.description !== undefined) medicine.description = data.description;
  if (data.howItWorks !== undefined) medicine.howItWorks = data.howItWorks;
  if (data.category !== undefined) medicine.category = data.category;
  if (data.stock !== undefined) medicine.stock = parseInt(data.stock);
  if (data.status) medicine.status = data.status;
  if (data.visibility !== undefined) medicine.visibility = parseBoolean(data.visibility);

  // Images
  if (images) {
    medicine.images = images;
  }

  // Arrays
  if (data.usage !== undefined) medicine.usage = normalizeUsage(parseIfString(data.usage));
  if (data.generics !== undefined) medicine.generics = parseIfString(data.generics);
  if (data.dosageOptions !== undefined) medicine.dosageOptions = parseIfString(data.dosageOptions);
  if (data.quantityOptions !== undefined) medicine.quantityOptions = parseIfString(data.quantityOptions);

  // Markup
  if (data.markup !== undefined) medicine.markup = parseFloat(data.markup);

  // Medical information
  if (data.precautions !== undefined) medicine.precautions = data.precautions;
  if (data.sideEffects !== undefined) medicine.sideEffects = data.sideEffects;
  if (data.drugInteractions !== undefined) medicine.drugInteractions = data.drugInteractions;
  if (data.indications !== undefined) medicine.indications = data.indications;

  // Health category
  if (healthCategoryData) {
    if (healthCategoryData.healthCategory !== undefined) {
      medicine.healthCategory = healthCategoryData.healthCategory;
    }
    if (healthCategoryData.healthTypeSlug !== undefined) {
      medicine.healthTypeSlug = healthCategoryData.healthTypeSlug;
    }
    if (healthCategoryData.healthTypeId !== undefined) {
      medicine.healthTypeId = healthCategoryData.healthTypeId;
    }
  }

  // Admin flags
  if (data.isTrendy !== undefined) medicine.isTrendy = parseBoolean(data.isTrendy);
  if (data.isBestOffer !== undefined) medicine.isBestOffer = parseBoolean(data.isBestOffer);
  if (data.discountPercentage !== undefined) {
    if (data.discountPercentage < 0 || data.discountPercentage > 100) {
      throw new AppError('Discount percentage must be between 0 and 100', 400);
    }
    medicine.discountPercentage = parseFloat(data.discountPercentage);
  }

  // Auto-update status based on stock
  if (data.stock !== undefined && !data.status) {
    medicine.status = calculateStockStatus(medicine.stock);
  }

  return medicine;
};

// ============ SIMILARITY SCORING HELPER ============

/**
 * Calculate similarity score between two medicines
 * @param {Object} medicine - Medicine to score
 * @param {Object} original - Original medicine
 * @returns {number} Similarity score
 */
const calculateSimilarityScore = (medicine, original) => {
  let score = 0;

  // Health category match (highest priority)
  if (medicine.healthCategory && original.healthCategory) {
    if (medicine.healthCategory.toString() === original.healthCategory.toString()) {
      score += 100;
    }
  }

  // Health type slug match
  if (medicine.healthTypeSlug === original.healthTypeSlug) {
    score += 50;
  }

  // Category match
  if (medicine.category === original.category) {
    score += 30;
  }

  // Generics match
  if (medicine.generics && original.generics) {
    const commonGenerics = medicine.generics.filter(g => 
      original.generics.includes(g)
    );
    score += commonGenerics.length * 10;
  }

  // Brand match
  if (medicine.brand === original.brand) {
    score += 20;
  }

  // Price similarity
  const priceDiff = Math.abs(medicine.salePrice - original.salePrice);
  const priceSimilarity = Math.max(0, 10 - (priceDiff / original.salePrice) * 10);
  score += priceSimilarity;

  return score;
};

// ============ VALIDATION HELPERS ============

/**
 * Validate medicine ID
 * @param {string} id - Medicine ID
 * @returns {boolean}
 */
const isValidMedicineId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Ensure valid ObjectId, throw if invalid
 * @param {string} id - ID to validate
 * @param {string} fieldName - Field name for error message
 */
const ensureValidObjectId = (id, fieldName = 'ID') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
};

// ============ POPULATE OPTIONS ============

const HEALTH_CATEGORY_POPULATE = {
  path: 'healthCategory',
  select: 'name slug description icon types',
  match: { isActive: true }
};

const HEALTH_CATEGORY_POPULATE_ALL = {
  path: 'healthCategory',
  select: 'name slug description icon types'
};

module.exports = {
  // Parsing helpers
  parseIfString,
  normalizeUsage,
  parseBoolean,
  
  // Health category helpers
  populateSubCategory,
  batchPopulateSubCategory,
  validateHealthCategory,
  
  // Image helpers
  processImages,
  
  // Filter/Sort helpers
  buildMedicineFilter,
  buildMedicineSort,
  
  // Stock helpers
  calculateStockStatus,
  isValidStatus,
  
  // Data building helpers
  buildMedicineData,
  applyMedicineUpdates,
  
  // Similarity helpers
  calculateSimilarityScore,
  
  // Validation helpers
  isValidMedicineId,
  ensureValidObjectId,
  
  // Populate options
  HEALTH_CATEGORY_POPULATE,
  HEALTH_CATEGORY_POPULATE_ALL
};

