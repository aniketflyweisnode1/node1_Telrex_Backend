/**
 * Address Service
 * Refactored to use shared helpers
 */

const Address = require('../../models/Address.model');
const AppError = require('../../utils/AppError');
const { getPatient } = require('../../helpers');

/**
 * Get all addresses for user
 */
exports.getAddresses = async (userId) => {
  const patient = await getPatient(userId);
  
  return await Address.find({ patient: patient._id })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();
};

/**
 * Get single address by ID
 */
exports.getAddressById = async (userId, addressId) => {
  const patient = await getPatient(userId);
  
  const address = await Address.findOne({ 
    _id: addressId, 
    patient: patient._id 
  }).lean();
  
  if (!address) throw new AppError('Address not found', 404);
  
  return address;
};

/**
 * Create new address
 */
exports.createAddress = async (userId, data) => {
  const patient = await getPatient(userId);
  
  // If setting as default, unset others first
  if (data.isDefault) {
    await Address.updateMany(
      { patient: patient._id },
      { $set: { isDefault: false } }
    );
  }
  
  return await Address.create({
    patient: patient._id,
    ...data
  });
};

/**
 * Update existing address
 */
exports.updateAddress = async (userId, addressId, data) => {
  const patient = await getPatient(userId);
  
  // If setting as default, unset others and update in parallel
  if (data.isDefault) {
    const [, address] = await Promise.all([
      Address.updateMany(
        { patient: patient._id, _id: { $ne: addressId } },
        { $set: { isDefault: false } }
      ),
      Address.findOneAndUpdate(
        { _id: addressId, patient: patient._id },
        { $set: data },
        { new: true, runValidators: true }
      ).lean()
    ]);
    
    if (!address) throw new AppError('Address not found', 404);
    return address;
  }
  
  const address = await Address.findOneAndUpdate(
    { _id: addressId, patient: patient._id },
    { $set: data },
    { new: true, runValidators: true }
  ).lean();
  
  if (!address) throw new AppError('Address not found', 404);
  return address;
};

/**
 * Delete address
 */
exports.deleteAddress = async (userId, addressId) => {
  const patient = await getPatient(userId);
  
  const address = await Address.findOneAndDelete({
    _id: addressId,
    patient: patient._id
  });
  
  if (!address) throw new AppError('Address not found', 404);
  
  return { message: 'Address deleted successfully' };
};
