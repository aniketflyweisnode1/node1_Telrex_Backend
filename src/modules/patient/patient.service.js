const Patient = require('../../models/Patient.model');
const User = require('../../models/User.model');
const AppError = require('../../utils/AppError');

// Get patient profile
exports.getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  
  let patient = await Patient.findOne({ user: userId }).populate('user', '-password');
  if (!patient) {
    // Create patient profile if doesn't exist
    patient = await Patient.create({ user: userId });
    patient = await Patient.findById(patient._id).populate('user', '-password');
  }
  
  return patient;
};

// Update patient profile
exports.updateProfile = async (userId, data) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found', 404);
  
  // Update user fields if provided
  if (data.firstName || data.lastName || data.email) {
    const userUpdate = {};
    if (data.firstName) userUpdate.firstName = data.firstName;
    if (data.lastName) userUpdate.lastName = data.lastName;
    if (data.email) userUpdate.email = data.email.toLowerCase();
    await User.findByIdAndUpdate(userId, userUpdate);
  }
  
  // Update or create patient profile
  let patient = await Patient.findOne({ user: userId });
  if (!patient) {
    patient = await Patient.create({ user: userId, ...data });
  } else {
    patient = await Patient.findByIdAndUpdate(patient._id, data, { new: true, runValidators: true });
  }
  
  patient = await Patient.findById(patient._id).populate('user', '-password');
  return patient;
};

