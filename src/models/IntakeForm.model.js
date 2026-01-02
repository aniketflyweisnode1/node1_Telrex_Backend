const mongoose = require('mongoose');

const intakeFormSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
      unique: true
    },
    
    // ====================
    // BASIC INFORMATION
    // ====================
    basicInformation: {
      firstName: String,
      middleName: String,
      lastName: String,
      sex: {
        type: String,
        enum: ['male', 'female', 'other']
      },
      dateOfBirth: Date,
      email: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      zip: String,
      maritalStatus: {
        type: String,
        enum: ['single', 'married', 'divorced', 'widowed', 'separated']
      },
      govtIssuedCertificate: {
        type: String,
        enum: ['aadhaar', 'pan', 'passport', 'driving_license', 'voter_id', 'other']
      },
      certificateUpload: String, // File URL or path
      isBasicInfoComplete: {
        type: Boolean,
        default: false
      }
    },
    
    // ====================
    // EMERGENCY CONTACT
    // ====================
    emergencyContact: {
      relationship: String,
      firstName: String,
      middleName: String,
      lastName: String,
      email: String,
      phone: String,
      primaryPhone: String,
      workPhone: String,
      address: String,
      city: String,
      zip: String,
      state: String,
      isEmergencyContactComplete: {
        type: Boolean,
        default: false
      }
    },
    
    // ====================
    // MEDICAL QUESTIONS
    // ====================
    medicalQuestions: {
      pastMedicalHistory: [String],
      currentMedications: [String],
      medicationAllergies: [String],
      preferredPharmacies: [{
        pharmacyName: String,
        address: String,
        city: String,
        state: String,
        zip: String
      }],
      howDidYouHearAboutUs: String,
      isMedicalQuestionsComplete: {
        type: Boolean,
        default: false
      }
    },
    
    // Overall form status
    status: {
      type: String,
      enum: ['draft', 'submitted', 'reviewed'],
      default: 'draft'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('IntakeForm', intakeFormSchema);

