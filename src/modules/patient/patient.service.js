/**
 * Patient Service - Profile management
 * Refactored to use shared helpers
 */

const Patient = require('../../models/Patient.model');
const User = require('../../models/User.model');
const AppError = require('../../utils/AppError');
const {
  getPatient,
  getDefaultAddress,
  formatPatientProfile,
  normalizeProfileData,
  extractUserUpdateFields
} = require('../../helpers');

/**
 * Get patient profile
 */
exports.getProfile = async (userId) => {
  // Get patient with user populated
  const patient = await getPatient(userId, { populate: true });
  
  // Get default address
  const address = await getDefaultAddress(patient._id);
  
  return formatPatientProfile(patient, address);
};

/**
 * Update patient profile
 */
exports.updateProfile = async (userId, data) => {
  // Extract and normalize data
  const patientData = normalizeProfileData(data);
  const userUpdate = extractUserUpdateFields(data);
  
  // Run user and patient updates in parallel
  const [userResult, patient] = await Promise.all([
    Object.keys(userUpdate).length > 0 
      ? User.findByIdAndUpdate(userId, userUpdate, { new: true }).lean()
      : User.findById(userId).lean(),
    Patient.findOneAndUpdate(
      { user: userId },
      { $set: patientData },
      { new: true, upsert: true, runValidators: true }
    ).lean()
  ]);
  
  if (!userResult) throw new AppError('User not found', 404);
  
  // Get address and format response
  const address = await getDefaultAddress(patient._id);
  const patientWithUser = { ...patient, user: userResult };
  
  return formatPatientProfile(patientWithUser, address);
};
