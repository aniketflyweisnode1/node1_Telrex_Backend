const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    specialty: {
      type: String,
      required: true,
      enum: [
        'General Practice',
        'Cardiology',
        'Pediatrics',
        'Dermatology',
        'Orthopedics',
        'Neurology',
        'Psychiatry',
        'Oncology',
        'Gynecology',
        'Urology',
        'Ophthalmology',
        'ENT',
        'Pulmonology',
        'Gastroenterology',
        'Endocrinology',
        'Rheumatology',
        'Other'
      ]
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    licenseVerified: {
      type: Boolean,
      default: false
    },
    licenseVerifiedAt: {
      type: Date
    },
    licenseVerifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    // Medical License Document (new structure)
    medicalLicense: {
      licenseNumber: {
        type: String,
        trim: true
      },
      documentUrl: {
        type: String
      },
      verified: {
        type: Boolean,
        default: false
      }
    },
    consultationFee: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'pending'
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      totalRatings: {
        type: Number,
        default: 0
      }
    },
    profilePicture: {
      type: String
    },
    // Profile Image (new structure)
    profileImage: {
      url: {
        type: String
      },
      verified: {
        type: Boolean,
        default: false
      }
    },
    bio: {
      type: String,
      maxlength: 1000
    },
    experience: {
      type: Number,
      min: 0
    },
    education: [{
      degree: String,
      institution: String,
      year: Number
    }],
    certifications: [{
      name: String,
      issuingOrganization: String,
      issuedBy: String, // Alias for issuingOrganization
      issueDate: Date,
      expiryDate: Date,
      year: Number
    }],
    languages: [{
      type: String
    }],
    availability: {
      days: [{
        type: String,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      }],
      timeSlots: [{
        from: String, // Format: "HH:MM"
        to: String    // Format: "HH:MM"
      }]
    },
    address: {
      clinicName: String,
      streetAddress: String,
      city: String,
      state: String,
      country: {
        type: String,
        default: 'India'
      },
      pincode: String,
      landmark: String
    },
    bankAccount: {
      accountHolderName: {
        type: String,
        trim: true
      },
      bankName: {
        type: String,
        trim: true
      },
      accountNumber: {
        type: String,
        trim: true
      },
      routingNumber: {
        type: String,
        trim: true
      },
      accountType: {
        type: String,
        enum: ['checking', 'savings', 'current'],
        default: 'checking'
      },
      ifscCode: {
        type: String,
        trim: true
      },
      swiftCode: {
        type: String,
        trim: true
      },
      verified: {
        type: Boolean,
        default: false
      },
      verifiedAt: {
        type: Date
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  { timestamps: true }
);

// Indexes for faster queries
// Note: user and licenseNumber already have indexes from unique: true
doctorSchema.index({ specialty: 1 });
doctorSchema.index({ status: 1 });
doctorSchema.index({ 'rating.average': -1 });
doctorSchema.index({ isActive: 1 });

// Virtual for full name
doctorSchema.virtual('fullName').get(function() {
  if (this.user && this.user.firstName && this.user.lastName) {
    return `${this.user.firstName} ${this.user.lastName}`;
  }
  return '';
});

// Method to update rating
doctorSchema.methods.updateRating = function(newRating) {
  const currentTotal = this.rating.average * this.rating.totalRatings;
  this.rating.totalRatings += 1;
  this.rating.average = (currentTotal + newRating) / this.rating.totalRatings;
  return this.save();
};

module.exports = mongoose.model('Doctor', doctorSchema);

