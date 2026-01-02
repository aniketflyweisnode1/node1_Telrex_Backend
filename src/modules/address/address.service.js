const Address = require('../../models/Address.model');
const Patient = require('../../models/Patient.model');
const AppError = require('../../utils/AppError');

// Get patient from userId
const getPatient = async (userId) => {
  const patient = await Patient.findOne({ user: userId });
  if (!patient) throw new AppError('Patient profile not found', 404);
  return patient;
};

// Get all addresses
exports.getAddresses = async (userId) => {
  const patient = await getPatient(userId);
  const addresses = await Address.find({ patient: patient._id }).sort({ isDefault: -1, createdAt: -1 });
  return addresses;
};

// Get single address by ID
exports.getAddressById = async (userId, addressId) => {
  const patient = await getPatient(userId);
  
  const address = await Address.findOne({
    _id: addressId,
    patient: patient._id
  });
  
  if (!address) {
    throw new AppError('Address not found', 404);
  }
  
  return address;
};

// Create address
exports.createAddress = async (userId, data) => {
  const patient = await getPatient(userId);
  
  // If this is set as default, unset other defaults
  if (data.isDefault) {
    await Address.updateMany(
      { patient: patient._id },
      { $set: { isDefault: false } }
    );
  }
  
  const address = await Address.create({
    patient: patient._id,
    ...data
  });
  
  return address;
};

// Update address
exports.updateAddress = async (userId, addressId, data) => {
  const patient = await getPatient(userId);
  
  const address = await Address.findOne({
    _id: addressId,
    patient: patient._id
  });
  
  if (!address) throw new AppError('Address not found', 404);
  
  // If setting as default, unset other defaults
  if (data.isDefault) {
    await Address.updateMany(
      { patient: patient._id, _id: { $ne: addressId } },
      { $set: { isDefault: false } }
    );
  }
  
  Object.assign(address, data);
  await address.save();
  
  return address;
};

// Delete address
exports.deleteAddress = async (userId, addressId) => {
  const patient = await getPatient(userId);
  
  const address = await Address.findOneAndDelete({
    _id: addressId,
    patient: patient._id
  });
  
  if (!address) throw new AppError('Address not found', 404);
  
  return { message: 'Address deleted successfully' };
};

