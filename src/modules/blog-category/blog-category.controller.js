const blogCategoryService = require('./blog-category.service');

// Get all blog categories
exports.getAllBlogCategories = async (req, res, next) => {
  try {
    // Check if user is authenticated (admin/sub-admin can see all, public can only see active)
    const isPublic = !req.user || (req.user.role !== 'admin' && req.user.role !== 'sub-admin');
    const result = await blogCategoryService.getAllBlogCategories(req.query, isPublic);
    res.status(200).json({
      success: true,
      message: 'Blog categories retrieved successfully',
      data: result.categories,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get blog category by ID
exports.getBlogCategoryById = async (req, res, next) => {
  try {
    // Check if user is authenticated (admin/sub-admin can see all, public can only see active)
    const isPublic = !req.user || (req.user.role !== 'admin' && req.user.role !== 'sub-admin');
    const category = await blogCategoryService.getBlogCategoryById(req.params.id, isPublic);
    res.status(200).json({
      success: true,
      message: 'Blog category retrieved successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// Get blog category by slug
exports.getBlogCategoryBySlug = async (req, res, next) => {
  try {
    const category = await blogCategoryService.getBlogCategoryBySlug(req.params.slug);
    res.status(200).json({
      success: true,
      message: 'Blog category retrieved successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// Create blog category
exports.createBlogCategory = async (req, res, next) => {
  try {
    const category = await blogCategoryService.createBlogCategory(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Blog category created successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// Update blog category
exports.updateBlogCategory = async (req, res, next) => {
  try {
    const category = await blogCategoryService.updateBlogCategory(req.params.id, req.body, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Blog category updated successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// Delete blog category
exports.deleteBlogCategory = async (req, res, next) => {
  try {
    const result = await blogCategoryService.deleteBlogCategory(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Blog category deleted successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Activate blog category
exports.activateBlogCategory = async (req, res, next) => {
  try {
    const category = await blogCategoryService.activateBlogCategory(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Blog category activated successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// Deactivate blog category
exports.deactivateBlogCategory = async (req, res, next) => {
  try {
    const category = await blogCategoryService.deactivateBlogCategory(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Blog category deactivated successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

