const mongoose = require('mongoose');
const Blog = require('../../models/Blog.model');
const BlogCategory = require('../../models/BlogCategory.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Helper function to parse JSON strings from form data
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

// Create new blog
exports.createBlog = async (data, files = [], req = null, authorId) => {
  // Validate category exists
  const category = await BlogCategory.findById(data.categoryId);
  if (!category) {
    throw new AppError('Blog category not found', 404);
  }
  
  if (!category.isActive) {
    throw new AppError('Cannot create blog in inactive category', 400);
  }

  let featuredImageData = {
    url: '',
    alt: ''
  };

  // Handle featured image from JSON body
  if (data.featuredImage) {
    const featuredImageInput = parseIfString(data.featuredImage);
    if (typeof featuredImageInput === 'object' && featuredImageInput !== null) {
      featuredImageData = {
        url: featuredImageInput.url || '',
        alt: featuredImageInput.alt || ''
      };
    }
  }

  // Handle featured image from file upload
  if (files && files.length > 0) {
    const featuredFile = files.find(file => file.fieldname === 'featuredImage' || file.originalname.includes('featured'));
    if (featuredFile) {
      const fileUrl = req
        ? `${req.protocol}://${req.get('host')}/uploads/${featuredFile.filename}`
        : `/uploads/${featuredFile.filename}`;
      
      if (!featuredImageData.url) {
        featuredImageData.url = fileUrl;
      }
    }
  }

  // Handle media array
  let mediaArray = [];
  if (data.media) {
    const mediaInput = parseIfString(data.media);
    if (Array.isArray(mediaInput)) {
      mediaArray = mediaInput;
    }
  }

  // Add uploaded files to media (excluding featured image)
  if (files && files.length > 0) {
    files.forEach(file => {
      if (file.fieldname !== 'featuredImage' && !file.originalname.includes('featured')) {
        const fileUrl = req
          ? `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
          : `/uploads/${file.filename}`;
        
        mediaArray.push({
          type: file.mimetype.startsWith('image/') ? 'image' : 
                file.mimetype.startsWith('video/') ? 'video' : 'document',
          url: fileUrl,
          alt: file.originalname
        });
      }
    });
  }

  // Handle tags
  let tagsArray = [];
  if (data.tags) {
    const tagsInput = parseIfString(data.tags);
    if (Array.isArray(tagsInput)) {
      tagsArray = tagsInput;
    } else if (typeof tagsInput === 'string') {
      tagsArray = tagsInput.split(',').map(tag => tag.trim().toLowerCase());
    }
  }

  // Handle seoKeywords
  let seoKeywordsArray = [];
  if (data.seoKeywords) {
    const keywordsInput = parseIfString(data.seoKeywords);
    if (Array.isArray(keywordsInput)) {
      seoKeywordsArray = keywordsInput;
    } else if (typeof keywordsInput === 'string') {
      seoKeywordsArray = keywordsInput.split(',').map(keyword => keyword.trim());
    }
  }

  const blogData = {
    title: data.title,
    category: data.categoryId,
    author: authorId,
    featuredImage: featuredImageData,
    excerpt: data.excerpt || '',
    content: data.content,
    media: mediaArray,
    tags: tagsArray,
    metaTitle: data.metaTitle || data.title,
    metaDescription: data.metaDescription || data.excerpt || '',
    status: data.status || 'draft',
    isFeatured: data.isFeatured === 'true' || data.isFeatured === true,
    seoKeywords: seoKeywordsArray
  };

  // Set publishedAt if status is published
  if (blogData.status === 'published') {
    blogData.publishedAt = new Date();
  }

  const blog = await Blog.create(blogData);
  
  // Populate category and author
  await blog.populate([
    {
      path: 'category',
      select: 'name slug description isActive'
    },
    {
      path: 'author',
      select: 'firstName lastName email'
    }
  ]);

  return blog;
};

// Get all blogs
exports.getAllBlogs = async (query = {}) => {
  const {
    search,
    categoryId,
    categorySlug,
    authorId,
    status,
    isFeatured,
    tags,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 10
  } = query;

  const filter = {};

  // Search filter
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { excerpt: { $regex: search, $options: 'i' } },
      { content: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Category filter
  if (categoryId) {
    filter.category = categoryId;
  }

  // Category slug filter (need to find category first)
  if (categorySlug) {
    const category = await BlogCategory.findOne({ slug: categorySlug, isActive: true });
    if (category) {
      filter.category = category._id;
    } else {
      // Return empty result if category not found
      return {
        blogs: [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: 0,
          pages: 0
        }
      };
    }
  }

  // Author filter
  if (authorId) {
    filter.author = authorId;
  }

  // Status filter
  if (status) {
    filter.status = status;
  } else {
    // Default: only show published blogs for public, all for admin
    // This will be handled in controller based on user role
  }

  // Featured filter
  if (isFeatured !== undefined) {
    filter.isFeatured = isFeatured === 'true' || isFeatured === true;
  }

  // Tags filter
  if (tags) {
    const tagsArray = Array.isArray(tags) ? tags : tags.split(',');
    filter.tags = { $in: tagsArray.map(tag => tag.trim().toLowerCase()) };
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const blogs = await Blog.find(filter)
    .populate({
      path: 'category',
      select: 'name slug description isActive'
    })
    .populate({
      path: 'author',
      select: 'firstName lastName email'
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Blog.countDocuments(filter);

  return {
    blogs,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get blog by ID
exports.getBlogById = async (blogId, incrementViews = false) => {
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    throw new AppError('Invalid blog ID', 400);
  }

  const blog = await Blog.findById(blogId)
    .populate({
      path: 'category',
      select: 'name slug description isActive'
    })
    .populate({
      path: 'author',
      select: 'firstName lastName email'
    });

  if (!blog) {
    throw new AppError('Blog not found', 404);
  }

  // Increment views if requested
  if (incrementViews) {
    blog.views += 1;
    await blog.save();
  }

  return blog;
};

// Get blog by slug
exports.getBlogBySlug = async (slug, incrementViews = false, isPublic = false) => {
  const filter = { slug };
  
  // For public access, only return published blogs
  if (isPublic) {
    filter.status = 'published';
  }

  const blog = await Blog.findOne(filter)
    .populate({
      path: 'category',
      select: 'name slug description isActive'
    })
    .populate({
      path: 'author',
      select: 'firstName lastName email'
    });

  if (!blog) {
    // Check if blog exists but is not published (for public access)
    if (isPublic) {
      const draftBlog = await Blog.findOne({ slug });
      if (draftBlog && draftBlog.status !== 'published') {
        throw new AppError('Blog is not published yet', 404);
      }
    }
    throw new AppError('Blog not found', 404);
  }

  // Increment views if requested
  if (incrementViews) {
    blog.views += 1;
    await blog.save();
  }

  return blog;
};

// Update blog
exports.updateBlog = async (blogId, data, files = [], req = null, authorId) => {
  const blog = await Blog.findById(blogId);

  if (!blog) {
    throw new AppError('Blog not found', 404);
  }

  // Validate category if being updated
  if (data.categoryId) {
    const category = await BlogCategory.findById(data.categoryId);
    if (!category) {
      throw new AppError('Blog category not found', 404);
    }
    if (!category.isActive) {
      throw new AppError('Cannot assign blog to inactive category', 400);
    }
    blog.category = data.categoryId;
  }

  // Update title
  if (data.title) {
    blog.title = data.title;
  }

  // Update featured image
  if (data.featuredImage !== undefined) {
    const featuredImageInput = parseIfString(data.featuredImage);
    if (typeof featuredImageInput === 'object' && featuredImageInput !== null) {
      blog.featuredImage = {
        url: featuredImageInput.url || blog.featuredImage?.url || '',
        alt: featuredImageInput.alt || blog.featuredImage?.alt || ''
      };
    }
  }

  // Handle featured image from file upload
  if (files && files.length > 0) {
    const featuredFile = files.find(file => file.fieldname === 'featuredImage' || file.originalname.includes('featured'));
    if (featuredFile) {
      const fileUrl = req
        ? `${req.protocol}://${req.get('host')}/uploads/${featuredFile.filename}`
        : `/uploads/${featuredFile.filename}`;
      
      blog.featuredImage = {
        url: fileUrl,
        alt: blog.featuredImage?.alt || featuredFile.originalname
      };
    }
  }

  // Update excerpt
  if (data.excerpt !== undefined) {
    blog.excerpt = data.excerpt;
  }

  // Update content
  if (data.content !== undefined) {
    blog.content = data.content;
  }

  // Update media
  if (data.media !== undefined) {
    const mediaInput = parseIfString(data.media);
    if (Array.isArray(mediaInput)) {
      blog.media = mediaInput;
    }
  }

  // Add uploaded files to media (excluding featured image)
  if (files && files.length > 0) {
    files.forEach(file => {
      if (file.fieldname !== 'featuredImage' && !file.originalname.includes('featured')) {
        const fileUrl = req
          ? `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
          : `/uploads/${file.filename}`;
        
        blog.media.push({
          type: file.mimetype.startsWith('image/') ? 'image' : 
                file.mimetype.startsWith('video/') ? 'video' : 'document',
          url: fileUrl,
          alt: file.originalname
        });
      }
    });
  }

  // Update tags
  if (data.tags !== undefined) {
    const tagsInput = parseIfString(data.tags);
    if (Array.isArray(tagsInput)) {
      blog.tags = tagsInput.map(tag => tag.trim().toLowerCase());
    } else if (typeof tagsInput === 'string') {
      blog.tags = tagsInput.split(',').map(tag => tag.trim().toLowerCase());
    }
  }

  // Update meta fields
  if (data.metaTitle !== undefined) {
    blog.metaTitle = data.metaTitle;
  }
  if (data.metaDescription !== undefined) {
    blog.metaDescription = data.metaDescription;
  }

  // Update status
  if (data.status !== undefined) {
    blog.status = data.status;
    // Set publishedAt when status changes to published
    if (data.status === 'published' && !blog.publishedAt) {
      blog.publishedAt = new Date();
    }
  }

  // Update featured
  if (data.isFeatured !== undefined) {
    blog.isFeatured = data.isFeatured === 'true' || data.isFeatured === true;
  }

  // Update seoKeywords
  if (data.seoKeywords !== undefined) {
    const keywordsInput = parseIfString(data.seoKeywords);
    if (Array.isArray(keywordsInput)) {
      blog.seoKeywords = keywordsInput;
    } else if (typeof keywordsInput === 'string') {
      blog.seoKeywords = keywordsInput.split(',').map(keyword => keyword.trim());
    }
  }

  await blog.save();

  // Populate category and author
  await blog.populate([
    {
      path: 'category',
      select: 'name slug description isActive'
    },
    {
      path: 'author',
      select: 'firstName lastName email'
    }
  ]);

  return blog;
};

// Delete blog (soft delete by setting status to archived)
exports.deleteBlog = async (blogId) => {
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    throw new AppError('Invalid blog ID', 400);
  }

  const blog = await Blog.findById(blogId);

  if (!blog) {
    throw new AppError('Blog not found', 404);
  }

  blog.status = 'archived';
  await blog.save();

  return {
    message: 'Blog archived successfully'
  };
};

// Permanently delete blog (hard delete)
exports.permanentlyDeleteBlog = async (blogId) => {
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    throw new AppError('Invalid blog ID', 400);
  }

  const blog = await Blog.findById(blogId);

  if (!blog) {
    throw new AppError('Blog not found', 404);
  }

  await Blog.findByIdAndDelete(blogId);

  return {
    message: 'Blog permanently deleted successfully'
  };
};

// Publish blog
exports.publishBlog = async (blogId) => {
  const blog = await Blog.findById(blogId);

  if (!blog) {
    throw new AppError('Blog not found', 404);
  }

  blog.status = 'published';
  if (!blog.publishedAt) {
    blog.publishedAt = new Date();
  }

  await blog.save();

  // Populate before returning
  await blog.populate([
    {
      path: 'category',
      select: 'name slug description isActive'
    },
    {
      path: 'author',
      select: 'firstName lastName email'
    }
  ]);

  return blog;
};

// Unpublish blog (set to draft)
exports.unpublishBlog = async (blogId) => {
  const blog = await Blog.findById(blogId);

  if (!blog) {
    throw new AppError('Blog not found', 404);
  }

  blog.status = 'draft';
  await blog.save();

  // Populate before returning
  await blog.populate([
    {
      path: 'category',
      select: 'name slug description isActive'
    },
    {
      path: 'author',
      select: 'firstName lastName email'
    }
  ]);

  return blog;
};

// Save blog as draft
exports.saveAsDraft = async (blogId) => {
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    throw new AppError('Invalid blog ID', 400);
  }

  const blog = await Blog.findById(blogId);

  if (!blog) {
    throw new AppError('Blog not found', 404);
  }

  blog.status = 'draft';
  // Clear publishedAt if it exists
  blog.publishedAt = undefined;
  await blog.save();

  // Populate before returning
  await blog.populate([
    {
      path: 'category',
      select: 'name slug description isActive'
    },
    {
      path: 'author',
      select: 'firstName lastName email'
    }
  ]);

  return blog;
};

// Get related blogs (same category, excluding current blog)
exports.getRelatedBlogs = async (blogId, limit = 5, isPublic = false) => {
  if (!mongoose.Types.ObjectId.isValid(blogId)) {
    throw new AppError('Invalid blog ID', 400);
  }

  const blogFilter = { _id: blogId };
  
  // For public access, only get published blogs
  if (isPublic) {
    blogFilter.status = 'published';
  }

  const blog = await Blog.findOne(blogFilter);

  if (!blog) {
    throw new AppError('Blog not found', 404);
  }

  // If blog doesn't have a category, return empty array
  if (!blog.category) {
    return [];
  }

  const relatedFilter = {
    category: blog.category,
    _id: { $ne: blogId },
    status: 'published' // Related blogs are always published
  };

  const relatedBlogs = await Blog.find(relatedFilter)
    .populate({
      path: 'category',
      select: 'name slug description isActive'
    })
    .populate({
      path: 'author',
      select: 'firstName lastName email'
    })
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .lean();

  return relatedBlogs;
};

