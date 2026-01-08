const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 5,
      maxlength: 200
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BlogCategory',
      required: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    featuredImage: {
      url: { type: String, trim: true },
      alt: { type: String, trim: true }
    },
    excerpt: {
      type: String,
      trim: true,
      maxlength: 500
    },
    content: {
      type: String,
      required: true
    },
    // Additional images/media in content
    media: [{
      type: {
        type: String,
        enum: ['image', 'video', 'document']
      },
      url: String,
      alt: String,
      caption: String
    }],
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    metaTitle: {
      type: String,
      trim: true,
      maxlength: 60
    },
    metaDescription: {
      type: String,
      trim: true,
      maxlength: 160
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft'
    },
    publishedAt: {
      type: Date
    },
    views: {
      type: Number,
      default: 0
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    seoKeywords: [String],
    readingTime: {
      type: Number, // in minutes
      default: 0
    }
  },
  { timestamps: true }
);

// Generate slug from title before save
blogSchema.pre('save', function (next) {
  if (this.isModified('title') && this.title && !this.slug) {
    // Generate slug from title (same approach as BlogCategory)
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  
  // Calculate reading time (approximately 200 words per minute)
  if (this.isModified('content') && this.content) {
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / 200);
  }
  
  // Set publishedAt when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Indexes
blogSchema.index({ category: 1, status: 1 });
blogSchema.index({ slug: 1, status: 1 });
blogSchema.index({ author: 1, status: 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ isFeatured: 1, status: 1 });
blogSchema.index({ tags: 1 });

module.exports = mongoose.model('Blog', blogSchema);

