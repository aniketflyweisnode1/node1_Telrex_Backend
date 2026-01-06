const blogService = require('./blog.service');

// Create new blog
exports.createBlog = async (req, res, next) => {
  try {
    const files = req.files || [];
    const authorId = req.user.id;
    const blog = await blogService.createBlog(req.body, files, req, authorId);

    res.status(201).json({
      success: true,
      message: 'Blog created successfully',
      data: blog
    });
  } catch (err) {
    next(err);
  }
};

// Get all blogs
exports.getAllBlogs = async (req, res, next) => {
  try {
    // For non-admin users or public access, only show published blogs
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'sub-admin')) {
      req.query.status = 'published';
    }

    const result = await blogService.getAllBlogs(req.query);

    res.status(200).json({
      success: true,
      message: 'Blogs retrieved successfully',
      data: result.blogs,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get blog by ID
exports.getBlogById = async (req, res, next) => {
  try {
    // Check if user is authenticated (admin/sub-admin can see all, public can only see published)
    const isPublic = !req.user || (req.user.role !== 'admin' && req.user.role !== 'sub-admin');
    const incrementViews = req.query.incrementViews === 'true';
    const blog = await blogService.getBlogById(req.params.id, incrementViews, isPublic);

    res.status(200).json({
      success: true,
      message: 'Blog retrieved successfully',
      data: blog
    });
  } catch (err) {
    next(err);
  }
};

// Get blog by slug
exports.getBlogBySlug = async (req, res, next) => {
  try {
    // Check if user is authenticated (admin/sub-admin can see all, public can only see published)
    const isPublic = !req.user || (req.user.role !== 'admin' && req.user.role !== 'sub-admin');
    const incrementViews = req.query.incrementViews === 'true';
    const blog = await blogService.getBlogBySlug(req.params.slug, incrementViews, isPublic);

    res.status(200).json({
      success: true,
      message: 'Blog retrieved successfully',
      data: blog
    });
  } catch (err) {
    next(err);
  }
};

// Update blog
exports.updateBlog = async (req, res, next) => {
  try {
    const files = req.files || [];
    const authorId = req.user.id;
    const blog = await blogService.updateBlog(req.params.id, req.body, files, req, authorId);

    res.status(200).json({
      success: true,
      message: 'Blog updated successfully',
      data: blog
    });
  } catch (err) {
    next(err);
  }
};

// Delete blog (soft delete - archive)
exports.deleteBlog = async (req, res, next) => {
  try {
    const result = await blogService.deleteBlog(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

// Permanently delete blog (hard delete)
exports.permanentlyDeleteBlog = async (req, res, next) => {
  try {
    const result = await blogService.permanentlyDeleteBlog(req.params.id);

    res.status(200).json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};

// Publish blog
exports.publishBlog = async (req, res, next) => {
  try {
    const blog = await blogService.publishBlog(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Blog published successfully',
      data: blog
    });
  } catch (err) {
    next(err);
  }
};

// Unpublish blog
exports.unpublishBlog = async (req, res, next) => {
  try {
    const blog = await blogService.unpublishBlog(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Blog unpublished successfully',
      data: blog
    });
  } catch (err) {
    next(err);
  }
};

// Save blog as draft
exports.saveAsDraft = async (req, res, next) => {
  try {
    const blog = await blogService.saveAsDraft(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Blog saved as draft successfully',
      data: blog
    });
  } catch (err) {
    next(err);
  }
};

// Get related blogs
exports.getRelatedBlogs = async (req, res, next) => {
  try {
    // Check if user is authenticated (admin/sub-admin can see all, public can only see published)
    const isPublic = !req.user || (req.user.role !== 'admin' && req.user.role !== 'sub-admin');
    const limit = parseInt(req.query.limit) || 5;
    const blogs = await blogService.getRelatedBlogs(req.params.id, limit, isPublic);

    res.status(200).json({
      success: true,
      message: 'Related blogs retrieved successfully',
      data: blogs
    });
  } catch (err) {
    next(err);
  }
};

