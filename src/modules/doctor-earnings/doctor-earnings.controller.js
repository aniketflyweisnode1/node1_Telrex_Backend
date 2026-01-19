const doctorEarningsService = require('./doctor-earnings.service');

// Get doctor earnings summary (Admin Panel - All Doctors with Details and Payment Info)
exports.getDoctorEarningsSummary = async (req, res, next) => {
  try {
    const result = await doctorEarningsService.getDoctorEarningsSummary(req.query);
    res.status(200).json({
      success: true,
      message: 'Doctor earnings summary retrieved successfully',
      data: result.doctors || [], // Array of multiple doctors with complete details (matching table structure from image)
      count: result.doctors?.length || 0,
      pagination: result.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
      }
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

// Get doctor bank account information (for Process Payout Modal)
exports.getDoctorBankAccount = async (req, res, next) => {
  try {
    const bankAccount = await doctorEarningsService.getDoctorBankAccount(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Doctor bank account information retrieved successfully',
      data: bankAccount
    });
  } catch (err) {
    next(err);
  }
};

// Process payout (Admin Panel - Process Payout Modal)
exports.processPayout = async (req, res, next) => {
  try {
    const payout = await doctorEarningsService.processPayout(
      req.params.id,
      req.body,
      req.user.id
    );
    res.status(201).json({
      success: true,
      message: `Payout of ${payout.amountDisplay} processed successfully for ${payout.doctor.displayName}`,
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

