const Patient = require('../../models/Patient.model');
const User = require('../../models/User.model');
const Address = require('../../models/Address.model');
const AppError = require('../../utils/AppError');

// Calculate age from dateOfBirth
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

// Format patient profile response
const formatProfileResponse = async (patient) => {
  const patientObj = patient.toObject ? patient.toObject() : patient;
  
  // Calculate age from dateOfBirth
  const age = calculateAge(patientObj.dateOfBirth);
  
  // Get default address or first address
  const defaultAddress = await Address.findOne({ 
    patient: patientObj._id, 
    isDefault: true 
  }).sort({ createdAt: -1 });
  
  const address = defaultAddress || await Address.findOne({ 
    patient: patientObj._id 
  }).sort({ createdAt: -1 });
  
  // Format response with additional fields
  return {
    ...patientObj,
    profileUrl: patientObj.profilePicture || null,
    age: age,
    address: address || null
  };
};

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
  
  return await formatProfileResponse(patient);
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
  
  // Handle profileImage/profileUrl -> profilePicture mapping
  const patientData = { ...data };
  if (data.profileImage) {
    patientData.profilePicture = data.profileImage;
    delete patientData.profileImage;
  } else if (data.profileUrl) {
    patientData.profilePicture = data.profileUrl;
    delete patientData.profileUrl;
  }
  
  // Update or create patient profile
  let patient = await Patient.findOne({ user: userId });
  if (!patient) {
    patient = await Patient.create({ user: userId, ...patientData });
  } else {
    patient = await Patient.findByIdAndUpdate(patient._id, patientData, { new: true, runValidators: true });
  }
  
  patient = await Patient.findById(patient._id).populate('user', '-password');
  return await formatProfileResponse(patient);
};

