const mongoose = require('mongoose');

const footerSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'logo',
        'about-us',
        'how-works',
        'leadership',
        'faq',
        'careers',
        'support',
        'blogs',
        'shipping-returns',
        'privacy-policy',
        'terms-conditions',
        'consent-telehealth',
        'contact',
        'address',
        'social-media'
      ],
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    
    // ========== LOGO SECTION ==========
    logo: {
      url: String, // Logo image URL
      alt: String  // Logo alt text
    },
    companyDescription: {
      type: String,
      maxlength: 500 // "Experience personalized medical care from the comfort of your home."
    },
    
    // ========== RICH TEXT CONTENT SECTIONS ==========
    // For: about-us, how-works, leadership, careers, support, shipping-returns, privacy-policy, terms-conditions, consent-telehealth
    content: {
      type: String, // HTML/Rich text content (from rich text editor)
      maxlength: 10000
    },
    // Media/images embedded in content (for rich text editor)
    media: [{
      type: {
        type: String,
        enum: ['image', 'video', 'document']
      },
      url: String,
      alt: String,
      caption: String
    }],
    
    // ========== FAQ SECTION (Multiple FAQs) ==========
    faqs: [{
      question: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
      },
      answer: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
      },
      order: {
        type: Number,
        default: 0
      }
    }],
    
    // ========== CONTACT SECTION ==========
    contact: {
      primaryMobile: {
        type: String,
        trim: true
      },
      primaryMobileCountryCode: {
        type: String,
        default: '+91'
      },
      secondaryMobile: {
        type: String,
        trim: true
      },
      secondaryMobileCountryCode: {
        type: String,
        default: '+91'
      },
      email: {
        type: String,
        trim: true
      },
      supportHours: String // "Mon-Fri 9AM-5PM EST"
    },
    
    // ========== ADDRESS SECTION ==========
    address: {
      location: {
        type: String, // Full address string: "24761 US Hwy 19 N | Clearwater, Florida 33763"
        trim: true
      },
      // Alternative structured format
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'United States'
      }
    },
    
    // ========== SOCIAL MEDIA SECTION ==========
    socialMedia: {
      facebook: String,
      instagram: String,
      linkedin: String,
      youtube: String,
      twitter: String, // Optional
      tiktok: String   // Optional
    },
    
    // ========== BLOG SECTION ==========
    // For blog links or featured blogs in footer
    blogLinks: [{
      title: String,
      url: String,
      category: String,
      tags: [String]
    }],
    
    // Link URL for simple link sections
    url: {
      type: String
    },
    
    // Status
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft'
    },
    
    // Order/position for display
    order: {
      type: Number,
      default: 0
    },
    
    // Last edited by
    lastEditedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
);

// Indexes
footerSchema.index({ section: 1, status: 1 });
footerSchema.index({ order: 1 });

module.exports = mongoose.model('Footer', footerSchema);

