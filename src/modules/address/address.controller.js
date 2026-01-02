const addressService = require('./address.service');

exports.getAddresses = async (req, res, next) => {
  try {
    const addresses = await addressService.getAddresses(req.user.id);
    res.status(200).json({ success: true, data: addresses });
  } catch (err) { next(err); }
};

exports.getAddressById = async (req, res, next) => {
  try {
    const address = await addressService.getAddressById(req.user.id, req.params.id);
    res.status(200).json({ success: true, data: address });
  } catch (err) { next(err); }
};

exports.createAddress = async (req, res, next) => {
  try {
    const address = await addressService.createAddress(req.user.id, req.body);
    res.status(201).json({ success: true, message: 'Address added successfully', data: address });
  } catch (err) { next(err); }
};

exports.updateAddress = async (req, res, next) => {
  try {
    const address = await addressService.updateAddress(req.user.id, req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Address updated successfully', data: address });
  } catch (err) { next(err); }
};

exports.deleteAddress = async (req, res, next) => {
  try {
    const result = await addressService.deleteAddress(req.user.id, req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (err) { next(err); }
};

