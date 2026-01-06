const BlogCategory = require('../../models/BlogCategory.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Get all blog categories
exports.getAllBlogCategories = async (query = {}, isPublic = false) => {
  const { 
    search, 
    isActive, 
    sortBy = 'order', 
    sortOrder = 'asc',
    page = 1,
    limit = 10
  } = query;

  const filter = {};
  
  // For public access, only return active categories
  if (isPublic) {
    filter.isActive = true;
  } else {
    // Active filter (only for admin/sub-admin)
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true' || isActive === true;
    }
  }
  
  // Search filter
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const categories = await BlogCategory.find(filter)
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

  const total = await BlogCategory.countDocuments(filter);

  return {
    categories,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get blog category by ID
exports.getBlogCategoryById = async (categoryId, isPublic = false) => {
  const filter = { _id: categoryId };
  
  // For public access, only return active categories
  if (isPublic) {
    filter.isActive = true;
  }

  const category = await BlogCategory.findOne(filter)
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
    // Check if category exists but is inactive (for public access)
    if (isPublic) {
      const inactiveCategory = await BlogCategory.findById(categoryId);
      if (inactiveCategory && !inactiveCategory.isActive) {
        throw new AppError('Blog category is not active', 404);
      }
    }
    throw new AppError('Blog category not found', 404);
  }

  return category;
};

// Get blog category by slug
exports.getBlogCategoryBySlug = async (slug) => {
  const category = await BlogCategory.findOne({ slug, isActive: true })
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
    throw new AppError('Blog category not found', 404);
  }

  return category;
};

// Create blog category
exports.createBlogCategory = async (data, userId) => {
  // Check if category with same name or slug already exists
  const existingCategory = await BlogCategory.findOne({
    $or: [
      { name: data.name },
      { slug: data.slug }
    ]
  });

  if (existingCategory) {
    throw new AppError('Blog category with this name or slug already exists', 409);
  }

  const categoryData = {
    ...data,
    createdBy: userId,
    updatedBy: userId
  };

  const category = await BlogCategory.create(categoryData);

  logger.info('Blog category created', {
    categoryId: category._id,
    name: category.name,
    createdBy: userId
  });

  return await BlogCategory.findById(category._id)
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

// Update blog category
exports.updateBlogCategory = async (categoryId, data, userId) => {
  const category = await BlogCategory.findById(categoryId);
  
  if (!category) {
    throw new AppError('Blog category not found', 404);
  }

  // Check if name or slug is being changed and if it conflicts with existing
  if (data.name || data.slug) {
    const existingCategory = await BlogCategory.findOne({
      _id: { $ne: categoryId },
      $or: [
        { name: data.name || category.name },
        { slug: data.slug || category.slug }
      ]
    });

    if (existingCategory) {
      throw new AppError('Blog category with this name or slug already exists', 409);
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

  logger.info('Blog category updated', {
    categoryId: category._id,
    name: category.name,
    updatedBy: userId
  });

  return await BlogCategory.findById(category._id)
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

// Delete blog category (soft delete)
exports.deleteBlogCategory = async (categoryId) => {
  const category = await BlogCategory.findById(categoryId);
  
  if (!category) {
    throw new AppError('Blog category not found', 404);
  }

  category.isActive = false;
  await category.save();

  logger.info('Blog category deleted', {
    categoryId: category._id,
    name: category.name
  });

  return { message: 'Blog category deleted successfully' };
};

// Activate blog category
exports.activateBlogCategory = async (categoryId, userId) => {
  const category = await BlogCategory.findById(categoryId);
  
  if (!category) {
    throw new AppError('Blog category not found', 404);
  }

  category.isActive = true;
  category.updatedBy = userId;
  await category.save();

  logger.info('Blog category activated', {
    categoryId: category._id,
    name: category.name,
    updatedBy: userId
  });

  return await BlogCategory.findById(category._id)
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

// Deactivate blog category
exports.deactivateBlogCategory = async (categoryId, userId) => {
  const category = await BlogCategory.findById(categoryId);
  
  if (!category) {
    throw new AppError('Blog category not found', 404);
  }

  category.isActive = false;
  category.updatedBy = userId;
  await category.save();

  logger.info('Blog category deactivated', {
    categoryId: category._id,
    name: category.name,
    updatedBy: userId
  });

  return await BlogCategory.findById(category._id)
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

