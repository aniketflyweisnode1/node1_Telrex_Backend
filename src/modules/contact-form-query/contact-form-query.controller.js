const contactFormQueryService = require('./contact-form-query.service');

// Create a new contact form query
exports.createContactFormQuery = async (req, res, next) => {
  try {
    // If user is logged in, include their ID
    const userId = req.user?.id || null;
    const contactFormQuery = await contactFormQueryService.createContactFormQuery(req.body, userId);
    res.status(201).json({
      success: true,
      message: 'Contact form query submitted successfully',
      data: contactFormQuery
    });
  } catch (err) {
    next(err);
  }
};

// Get all contact form queries
exports.getAllContactFormQueries = async (req, res, next) => {
  try {
    const result = await contactFormQueryService.getAllContactFormQueries(req.query);
    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get contact form query by ID
exports.getContactFormQueryById = async (req, res, next) => {
  try {
    const contactFormQuery = await contactFormQueryService.getContactFormQueryById(req.params.id);
    res.status(200).json({
      success: true,
      data: contactFormQuery
    });
  } catch (err) {
    next(err);
  }
};

// Update contact form query
exports.updateContactFormQuery = async (req, res, next) => {
  try {
    const contactFormQuery = await contactFormQueryService.updateContactFormQuery(
      req.params.id,
      req.body,
      req.user?.id
    );
    res.status(200).json({
      success: true,
      message: 'Contact form query updated successfully',
      data: contactFormQuery
    });
  } catch (err) {
    next(err);
  }
};

// Delete contact form query
exports.deleteContactFormQuery = async (req, res, next) => {
  try {
    await contactFormQueryService.deleteContactFormQuery(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Contact form query deleted successfully'
    });
  } catch (err) {
    next(err);
  }
};

// Get statistics
exports.getContactFormQueryStatistics = async (req, res, next) => {
  try {
    const statistics = await contactFormQueryService.getContactFormQueryStatistics();
    res.status(200).json({
      success: true,
      data: statistics
    });
  } catch (err) {
    next(err);
  }
};

