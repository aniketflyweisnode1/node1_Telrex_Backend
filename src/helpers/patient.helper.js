/**
 * Patient Helper - Shared utilities for patient-related operations
 * Eliminates code duplication across patient, cart, order, address services
 */

const Patient = require('../models/Patient.model');
const User = require('../models/User.model');
const Address = require('../models/Address.model');
const AppError = require('../utils/AppError');

/**
 * Get or create patient profile from userId
 * Auto-creates patient if doesn't exist
 * @param {string} userId - User ID
 * @param {Object} options - Options { lean: true, populate: false }
 * @returns {Object} Patient document
 */
const getPatient = async (userId, options = {}) => {
  const { lean = true, populate = false } = options;
  
  let query = Patient.findOne({ user: userId });
  
  if (populate) {
    query = query.populate('user', '-password');
  }
  
  if (lean) {
    query = query.lean();
  }
  
  let patient = await query;
  
  if (!patient) {
    // Auto-create patient profile
    const newPatient = await Patient.create({ user: userId, isActive: true });
    
    if (populate) {
      patient = await Patient.findById(newPatient._id)
        .populate('user', '-password')
        .lean();
    } else {
      patient = lean ? newPatient.toObject() : newPatient;
    }
  }
  
  return patient;
};

/**
 * Get patient with validation (throws if user doesn't exist)
 * @param {string} userId - User ID
 * @returns {Object} Patient document
 */
const getPatientStrict = async (userId) => {
  const patient = await getPatient(userId);
  
  // Verify user exists
  const userExists = await User.exists({ _id: userId });
  if (!userExists) {
    throw new AppError('User not found', 404);
  }
  
  return patient;
};

/**
 * Get patient's default address
 * @param {string} patientId - Patient ID
 * @returns {Object|null} Address document or null
 */
const getDefaultAddress = async (patientId) => {
  return await Address.findOne({ patient: patientId })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();
};

/**
 * Calculate age from date of birth
 * @param {Date|string} dateOfBirth - Date of birth
 * @returns {number|null} Age in years or null
 */
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Format patient profile response
 * @param {Object} patient - Patient document
 * @param {Object} address - Address document (optional)
 * @returns {Object} Formatted patient profile
 */
const formatPatientProfile = (patient, address = null) => {
  const patientObj = patient.toObject ? patient.toObject() : patient;
  
  return {
    ...patientObj,
    profileUrl: patientObj.profilePicture || null,
    age: calculateAge(patientObj.dateOfBirth),
    address: address || null
  };
};

/**
 * Normalize profile image field names
 * Maps profileImage/profileUrl to profilePicture
 * @param {Object} data - Input data
 * @returns {Object} Normalized data
 */
const normalizeProfileData = (data) => {
  const normalized = { ...data };
  
  if (data.profileImage) {
    normalized.profilePicture = data.profileImage;
    delete normalized.profileImage;
  } else if (data.profileUrl) {
    normalized.profilePicture = data.profileUrl;
    delete normalized.profileUrl;
  }
  
  // Remove user-specific fields from patient data
  delete normalized.firstName;
  delete normalized.lastName;
  delete normalized.email;
  
  return normalized;
};

/**
 * Extract user update fields from data
 * @param {Object} data - Input data
 * @returns {Object} User update fields
 */
const extractUserUpdateFields = (data) => {
  const userUpdate = {};
  
  if (data.firstName) userUpdate.firstName = data.firstName;
  if (data.lastName) userUpdate.lastName = data.lastName;
  if (data.email) userUpdate.email = data.email.toLowerCase();
  
  return userUpdate;
};

module.exports = {
  getPatient,
  getPatientStrict,
  getDefaultAddress,
  calculateAge,
  formatPatientProfile,
  normalizeProfileData,
  extractUserUpdateFields
};

