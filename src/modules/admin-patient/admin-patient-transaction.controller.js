const adminPatientTransactionService = require('./admin-patient-transaction.service');

/**
 * Get transaction history for a patient
 * GET /api/v1/admin/patients/:id/transactions
 */
exports.getTransactionHistory = async (req, res, next) => {
  try {
    const result = await adminPatientTransactionService.getTransactionHistory(
      req.params.id,
      req.query
    );
    res.status(200).json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
      statistics: result.statistics
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get transaction by ID for a patient
 * GET /api/v1/admin/patients/:id/transactions/:transactionId
 */
exports.getTransactionById = async (req, res, next) => {
  try {
    const transaction = await adminPatientTransactionService.getTransactionById(
      req.params.id,
      req.params.transactionId
    );
    res.status(200).json({
      success: true,
      data: transaction
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get invoice for a transaction
 * GET /api/v1/admin/patients/:id/transactions/:transactionId/invoice
 */
exports.getTransactionInvoice = async (req, res, next) => {
  try {
    const invoice = await adminPatientTransactionService.getTransactionInvoice(
      req.params.id,
      req.params.transactionId
    );
    res.status(200).json({
      success: true,
      data: invoice
    });
  } catch (err) {
    next(err);
  }
};

