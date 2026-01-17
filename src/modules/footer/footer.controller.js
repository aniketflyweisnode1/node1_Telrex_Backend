const footerService = require('./footer.service');
const logger = require('../../utils/logger');

// Get all footer sections
exports.getAllFooterSections = async (req, res, next) => {
  try {
    // Check if user is authenticated (admin/sub-admin can see all, public can only see published)
    // req.user might be undefined for public routes, so check safely
    const isPublic = !req.user || (req.user && req.user.role !== 'admin' && req.user.role !== 'sub-admin');
    const sections = await footerService.getAllFooterSections(req.query, isPublic);
    res.status(200).json({
      success: true,
      message: 'Footer sections retrieved successfully',
      data: sections
    });
  } catch (err) {
    next(err);
  }
};

// Get footer section by section name
exports.getFooterSectionBySection = async (req, res, next) => {
  try {
    // Check if user is authenticated (admin/sub-admin can see all, public can only see published)
    // req.user might be undefined for public routes, so check safely
    // If req.user exists and has admin/sub-admin role, isPublic = false (can see draft)
    // If req.user doesn't exist or is not admin/sub-admin, isPublic = true (only published)
    const isPublic = !req.user || (req.user && req.user.role !== 'admin' && req.user.role !== 'sub-admin');
    
    const section = await footerService.getFooterSectionBySection(req.params.section, isPublic);
    
    // If section is null (doesn't exist or not published for public), return empty data
    // This allows frontend to handle gracefully without throwing errors
    if (section === null) {
      return res.status(200).json({
        success: true,
        message: 'Footer section not found',
        data: null
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Footer section retrieved successfully',
      data: section
    });
  } catch (err) {
    next(err);
  }
};

// Get footer section by ID
exports.getFooterSectionById = async (req, res, next) => {
  try {
    // Check if user is authenticated (admin/sub-admin can see all, public can only see published)
    // req.user might be undefined for public routes, so check safely
    const isPublic = !req.user || (req.user && req.user.role !== 'admin' && req.user.role !== 'sub-admin');
    const section = await footerService.getFooterSectionById(req.params.id, isPublic);
    
    // If section is null (doesn't exist or not published for public), return empty data
    if (section === null) {
      return res.status(200).json({
        success: true,
        message: 'Footer section not found',
        data: null
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Footer section retrieved successfully',
      data: section
    });
  } catch (err) {
    next(err);
  }
};

// Create footer section
exports.createFooterSection = async (req, res, next) => {
  try {
    // If section is set via middleware (from route params), use it
    const body = req.params.section 
      ? { ...req.body, section: req.params.section }
      : req.body;
    
    const section = await footerService.createFooterSection(body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Footer section created successfully',
      data: section
    });
  } catch (err) {
    next(err);
  }
};

// Update footer section
exports.updateFooterSection = async (req, res, next) => {
  try {
    const section = await footerService.updateFooterSection(req.params.id, req.body, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Footer section updated successfully',
      data: section
    });
  } catch (err) {
    next(err);
  }
};

// Update footer section by section name
exports.updateFooterSectionBySection = async (req, res, next) => {
  try {
    const section = await footerService.updateFooterSectionBySection(req.params.section, req.body, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Footer section updated successfully',
      data: section
    });
  } catch (err) {
    next(err);
  }
};

// Delete footer section
exports.deleteFooterSection = async (req, res, next) => {
  try {
    const result = await footerService.deleteFooterSection(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Footer section deleted successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Publish footer section
exports.publishFooterSection = async (req, res, next) => {
  try {
    const section = await footerService.publishFooterSection(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Footer section published successfully',
      data: section
    });
  } catch (err) {
    next(err);
  }
};

// Save as draft
exports.saveAsDraft = async (req, res, next) => {
  try {
    const section = await footerService.saveAsDraft(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Footer section saved as draft successfully',
      data: section
    });
  } catch (err) {
    next(err);
  }
};

