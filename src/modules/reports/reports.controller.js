const reportsService = require('./reports.service');

// Get Consultation Activity Report
exports.getConsultationActivity = async (req, res, next) => {
  try {
    const result = await reportsService.getConsultationActivity(req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get Prescriptions & Orders Report
exports.getPrescriptionsAndOrders = async (req, res, next) => {
  try {
    const result = await reportsService.getPrescriptionsAndOrders(req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      summary: result.summary
    });
  } catch (err) {
    next(err);
  }
};

// Get Financial Settlement Report
exports.getFinancialSettlement = async (req, res, next) => {
  try {
    const result = await reportsService.getFinancialSettlement(req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      summary: result.summary
    });
  } catch (err) {
    next(err);
  }
};

// Get Pharmacy Inventory Report
exports.getPharmacyInventory = async (req, res, next) => {
  try {
    const result = await reportsService.getPharmacyInventory(req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      brands: result.brands,
      summary: result.summary
    });
  } catch (err) {
    next(err);
  }
};

// Export Consultation Activity (placeholder - implement actual export logic)
exports.exportConsultationActivity = async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query;
    const result = await reportsService.getConsultationActivity({ ...req.query, limit: 10000 });
    
    // TODO: Implement actual export logic using libraries like exceljs, csv-writer, pdfkit
    // For now, return JSON data
    res.status(200).json({
      success: true,
      message: `Export functionality for ${format} format will be implemented`,
      data: result.data,
      format
    });
  } catch (err) {
    next(err);
  }
};

// Export Prescriptions & Orders (placeholder)
exports.exportPrescriptionsAndOrders = async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query;
    const result = await reportsService.getPrescriptionsAndOrders({ ...req.query, limit: 10000 });
    
    res.status(200).json({
      success: true,
      message: `Export functionality for ${format} format will be implemented`,
      data: result.data,
      format
    });
  } catch (err) {
    next(err);
  }
};

// Export Financial Settlement (placeholder)
exports.exportFinancialSettlement = async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query;
    const result = await reportsService.getFinancialSettlement({ ...req.query, limit: 10000 });
    
    res.status(200).json({
      success: true,
      message: `Export functionality for ${format} format will be implemented`,
      data: result.data,
      format
    });
  } catch (err) {
    next(err);
  }
};

// Export Pharmacy Inventory (placeholder)
exports.exportPharmacyInventory = async (req, res, next) => {
  try {
    const { format = 'excel' } = req.query;
    const result = await reportsService.getPharmacyInventory({ ...req.query, limit: 10000 });
    
    res.status(200).json({
      success: true,
      message: `Export functionality for ${format} format will be implemented`,
      data: result.data,
      format
    });
  } catch (err) {
    next(err);
  }
};

