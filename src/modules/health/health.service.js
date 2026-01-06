const HealthCategory = require('../../models/HealthCategory.model');
const Medicine = require('../../models/Medicine.model');
const AppError = require('../../utils/AppError');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');

// Get all health categories
exports.getAllHealthCategories = async (query = {}) => {
  const {
    search,
    isActive,
    sortBy = 'order',
    sortOrder = 'asc',
    page = 1,
    limit = 100
  } = query;

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

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const categories = await HealthCategory.find(filter)
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'updatedBy',
      select: 'firstName lastName email'
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Filter active types within categories
  const categoriesWithActiveTypes = categories.map(category => ({
    ...category,
    types: category.types ? category.types.filter(type => type.isActive !== false) : []
  }));

  const total = await HealthCategory.countDocuments(filter);

  return {
    categories: categoriesWithActiveTypes,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get health category by ID
exports.getHealthCategoryById = async (categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid health category ID', 400);
  }

  const category = await HealthCategory.findById(categoryId)
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'updatedBy',
      select: 'firstName lastName email'
    })
    .lean();

  if (!category) {
    throw new AppError('Health category not found', 404);
  }

  // Filter active types
  if (category.types) {
    category.types = category.types.filter(type => type.isActive !== false);
  }

  return category;
};

// Get health category by slug
exports.getHealthCategoryBySlug = async (slug) => {
  const category = await HealthCategory.findOne({ slug, isActive: true })
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'updatedBy',
      select: 'firstName lastName email'
    })
    .lean();

  if (!category) {
    throw new AppError('Health category not found', 404);
  }

  // Filter active types
  if (category.types) {
    category.types = category.types.filter(type => type.isActive !== false);
  }

  return category;
};

// Get types (chronic conditions) for a category
exports.getCategoryTypes = async (categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid health category ID', 400);
  }

  const category = await HealthCategory.findById(categoryId).lean();

  if (!category) {
    throw new AppError('Health category not found', 404);
  }

  // Return only active types
  const types = category.types ? category.types.filter(type => type.isActive !== false) : [];

  return {
    category: {
      _id: category._id,
      name: category.name,
      slug: category.slug
    },
    types: types.sort((a, b) => (a.order || 0) - (b.order || 0))
  };
};

// Get medications by health category ID
exports.getMedicationsByCategoryId = async (categoryId, query = {}) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid health category ID', 400);
  }

  // Verify category exists and is active
  const category = await HealthCategory.findById(categoryId);
  if (!category) {
    throw new AppError('Health category not found', 404);
  }

  const {
    search,
    healthTypeSlug, // Chronic condition slug (e.g., 'asthma', 'dry-eye')
    minPrice,
    maxPrice,
    status,
    inStock,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = query;

  const filter = {
    isActive: true,
    visibility: true,
    healthCategory: categoryId // Filter by specific health category
  };

  // Search filter
  if (search) {
    filter.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { generics: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Health type filter (chronic condition)
  if (healthTypeSlug) {
    filter.healthTypeSlug = healthTypeSlug;
  }

  // Price filters
  if (minPrice !== undefined) {
    filter.salePrice = { $gte: parseFloat(minPrice) };
  }
  if (maxPrice !== undefined) {
    filter.salePrice = { ...filter.salePrice, $lte: parseFloat(maxPrice) };
  }

  // Status filter
  if (status) {
    filter.status = status;
  }

  // Stock filter
  if (inStock === 'true' || inStock === true) {
    filter.$or = [
      { status: 'in_stock' },
      { status: 'low_stock' }
    ];
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const medications = await Medicine.find(filter)
    .populate({
      path: 'healthCategory',
      select: 'name slug description icon',
      match: { isActive: true }
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Medicine.countDocuments(filter);

  return {
    category: {
      _id: category._id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon
    },
    medications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get medications with filters
exports.getMedications = async (query = {}) => {
  const {
    search,
    category,
    healthCategoryId,
    healthTypeSlug, // Chronic condition slug (e.g., 'asthma', 'dry-eye')
    minPrice,
    maxPrice,
    status,
    inStock,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = query;

  const filter = {
    isActive: true,
    visibility: true
  };

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

  // Health category filter (if healthCategoryId provided)
  if (healthCategoryId && mongoose.Types.ObjectId.isValid(healthCategoryId)) {
    filter.healthCategory = healthCategoryId;
  }

  // Health type filter (chronic condition)
  if (healthTypeSlug) {
    filter.healthTypeSlug = healthTypeSlug;
  }

  // Price filters
  if (minPrice !== undefined) {
    filter.salePrice = { $gte: parseFloat(minPrice) };
  }
  if (maxPrice !== undefined) {
    filter.salePrice = { ...filter.salePrice, $lte: parseFloat(maxPrice) };
  }

  // Status filter
  if (status) {
    filter.status = status;
  }

  // Stock filter
  if (inStock === 'true' || inStock === true) {
    filter.$or = [
      { status: 'in_stock' },
      { status: 'low_stock' }
    ];
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const medications = await Medicine.find(filter)
    .populate({
      path: 'healthCategory',
      select: 'name slug description icon',
      match: { isActive: true }
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Medicine.countDocuments(filter);

  return {
    medications,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get trendy medications (admin marked as trendy)
exports.getTrendyMedications = async (query = {}) => {
  const {
    limit = 10,
    category,
    healthCategoryId
  } = query;

  const filter = {
    isActive: true,
    visibility: true,
    status: { $in: ['in_stock', 'low_stock'] },
    isTrendy: true // Only return admin-marked trendy medications
  };

  if (category) {
    filter.category = { $regex: category, $options: 'i' };
  }

  if (healthCategoryId && mongoose.Types.ObjectId.isValid(healthCategoryId)) {
    filter.healthCategory = healthCategoryId;
  }

  // Sort by views (popularity) or createdAt (newest trendy items)
  const medications = await Medicine.find(filter)
    .populate({
      path: 'healthCategory',
      select: 'name slug description icon',
      match: { isActive: true }
    })
    .sort({ views: -1, createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  return {
    medications
  };
};

// Get best offers (admin marked as best offer)
exports.getBestOffers = async (query = {}) => {
  const {
    limit = 10,
    category,
    healthCategoryId
  } = query;

  const filter = {
    isActive: true,
    visibility: true,
    status: { $in: ['in_stock', 'low_stock'] },
    isBestOffer: true // Only return admin-marked best offer medications
  };

  if (category) {
    filter.category = { $regex: category, $options: 'i' };
  }

  if (healthCategoryId && mongoose.Types.ObjectId.isValid(healthCategoryId)) {
    filter.healthCategory = healthCategoryId;
  }

  // Get medications and calculate discount
  const medications = await Medicine.find(filter)
    .populate({
      path: 'healthCategory',
      select: 'name slug description icon',
      match: { isActive: true }
    })
    .lean();

  // Calculate discount for each medication
  const medicationsWithDiscount = medications.map(med => {
    // Use discountPercentage if set, otherwise calculate from prices
    let discount = 0;
    if (med.discountPercentage !== null && med.discountPercentage !== undefined) {
      discount = med.discountPercentage;
    } else if (med.originalPrice > 0) {
      discount = ((med.originalPrice - med.salePrice) / med.originalPrice) * 100;
    }
    return {
      ...med,
      discount: Math.round(discount * 100) / 100 // Round to 2 decimal places
    };
  });

  // Sort by discount (highest first), then by views
  medicationsWithDiscount.sort((a, b) => {
    if (b.discount !== a.discount) {
      return b.discount - a.discount;
    }
    return b.views - a.views;
  });

  // Return top N
  const topOffers = medicationsWithDiscount.slice(0, parseInt(limit));

  return {
    medications: topOffers
  };
};

// Create health category
exports.createHealthCategory = async (data, userId) => {
  // Check if category with same name or slug already exists
  const existingCategory = await HealthCategory.findOne({
    $or: [
      { name: data.name },
      { slug: data.slug }
    ]
  });

  if (existingCategory) {
    throw new AppError('Health category with this name or slug already exists', 409);
  }

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
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'updatedBy',
      select: 'firstName lastName email'
    })
    .lean();
};

// Update health category
exports.updateHealthCategory = async (categoryId, data, userId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid health category ID', 400);
  }

  const category = await HealthCategory.findById(categoryId);
  
  if (!category) {
    throw new AppError('Health category not found', 404);
  }

  // Check if name or slug is being changed and if it conflicts with existing
  if (data.name || data.slug) {
    const existingCategory = await HealthCategory.findOne({
      _id: { $ne: categoryId },
      $or: [
        { name: data.name || category.name },
        { slug: data.slug || category.slug }
      ]
    });

    if (existingCategory) {
      throw new AppError('Health category with this name or slug already exists', 409);
    }
  }

  // Update fields
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
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'updatedBy',
      select: 'firstName lastName email'
    })
    .lean();
};

// Delete health category (soft delete)
exports.deleteHealthCategory = async (categoryId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid health category ID', 400);
  }

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

// Activate health category
exports.activateHealthCategory = async (categoryId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid health category ID', 400);
  }

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
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'updatedBy',
      select: 'firstName lastName email'
    })
    .lean();
};

// Deactivate health category
exports.deactivateHealthCategory = async (categoryId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(categoryId)) {
    throw new AppError('Invalid health category ID', 400);
  }

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
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'updatedBy',
      select: 'firstName lastName email'
    })
    .lean();
};

// Mark medicine as trendy
exports.markMedicineAsTrendy = async (medicineId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(medicineId)) {
    throw new AppError('Invalid medicine ID', 400);
  }

  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  medicine.isTrendy = true;
  await medicine.save();

  logger.info('Medicine marked as trendy', {
    medicineId: medicine._id,
    productName: medicine.productName,
    updatedBy: userId
  });

  return await Medicine.findById(medicine._id)
    .populate({
      path: 'healthCategory',
      select: 'name slug description icon'
    })
    .lean();
};

// Unmark medicine as trendy
exports.unmarkMedicineAsTrendy = async (medicineId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(medicineId)) {
    throw new AppError('Invalid medicine ID', 400);
  }

  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  medicine.isTrendy = false;
  await medicine.save();

  logger.info('Medicine unmarked as trendy', {
    medicineId: medicine._id,
    productName: medicine.productName,
    updatedBy: userId
  });

  return await Medicine.findById(medicine._id)
    .populate({
      path: 'healthCategory',
      select: 'name slug description icon'
    })
    .lean();
};

// Mark medicine as best offer
exports.markMedicineAsBestOffer = async (medicineId, data, userId) => {
  if (!mongoose.Types.ObjectId.isValid(medicineId)) {
    throw new AppError('Invalid medicine ID', 400);
  }

  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  medicine.isBestOffer = true;
  
  // Set discount percentage if provided
  if (data && data.discountPercentage !== undefined) {
    if (data.discountPercentage < 0 || data.discountPercentage > 100) {
      throw new AppError('Discount percentage must be between 0 and 100', 400);
    }
    medicine.discountPercentage = data.discountPercentage;
  }

  await medicine.save();

  logger.info('Medicine marked as best offer', {
    medicineId: medicine._id,
    productName: medicine.productName,
    discountPercentage: medicine.discountPercentage,
    updatedBy: userId
  });

  return await Medicine.findById(medicine._id)
    .populate({
      path: 'healthCategory',
      select: 'name slug description icon'
    })
    .lean();
};

// Unmark medicine as best offer
exports.unmarkMedicineAsBestOffer = async (medicineId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(medicineId)) {
    throw new AppError('Invalid medicine ID', 400);
  }

  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  medicine.isBestOffer = false;
  await medicine.save();

  logger.info('Medicine unmarked as best offer', {
    medicineId: medicine._id,
    productName: medicine.productName,
    updatedBy: userId
  });

  return await Medicine.findById(medicine._id)
    .populate({
      path: 'healthCategory',
      select: 'name slug description icon'
    })
    .lean();
};

// Update medicine health category and type
exports.updateMedicineHealthRelation = async (medicineId, data, userId) => {
  if (!mongoose.Types.ObjectId.isValid(medicineId)) {
    throw new AppError('Invalid medicine ID', 400);
  }

  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  // Validate healthCategory if provided
  if (data.healthCategory) {
    if (!mongoose.Types.ObjectId.isValid(data.healthCategory)) {
      throw new AppError('Invalid health category ID', 400);
    }

    const healthCategory = await HealthCategory.findById(data.healthCategory);
    if (!healthCategory || !healthCategory.isActive) {
      throw new AppError('Health category not found or inactive', 404);
    }

    medicine.healthCategory = data.healthCategory;
  }

  // Validate healthTypeSlug if provided
  if (data.healthTypeSlug) {
    // Verify the type exists in the health category
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
    .populate({
      path: 'healthCategory',
      select: 'name slug description icon types'
    })
    .lean();
};
