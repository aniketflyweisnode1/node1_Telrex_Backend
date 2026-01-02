const doctorEarningsService = require('./doctor-earnings.service');

// Get doctor earnings summary
exports.getDoctorEarningsSummary = async (req, res, next) => {
  try {
    const result = await doctorEarningsService.getDoctorEarningsSummary(req.query);
    res.status(200).json({
      success: true,
      data: result.doctors,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get doctor earnings by ID
exports.getDoctorEarningsById = async (req, res, next) => {
  try {
    const earnings = await doctorEarningsService.getDoctorEarningsById(req.params.id);
    res.status(200).json({
      success: true,
      data: earnings
    });
  } catch (err) {
    next(err);
  }
};

// Get doctor bank account information
exports.getDoctorBankAccount = async (req, res, next) => {
  try {
    const bankAccount = await doctorEarningsService.getDoctorBankAccount(req.params.id);
    res.status(200).json({
      success: true,
      data: bankAccount
    });
  } catch (err) {
    next(err);
  }
};

// Process payout
exports.processPayout = async (req, res, next) => {
  try {
    const payout = await doctorEarningsService.processPayout(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(201).json({
      success: true,
      message: 'Payout processed successfully',
      data: payout
    });
  } catch (err) {
    next(err);
  }
};

// Update payout status
exports.updatePayoutStatus = async (req, res, next) => {
  try {
    const { status, transactionId, failureReason } = req.body;
    const payout = await doctorEarningsService.updatePayoutStatus(
      req.params.payoutId,
      status,
      transactionId,
      failureReason
    );
    res.status(200).json({
      success: true,
      message: 'Payout status updated successfully',
      data: payout
    });
  } catch (err) {
    next(err);
  }
};

