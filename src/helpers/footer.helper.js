/**
 * Footer Helper - Shared utilities for footer management
 * Optimized for minimum response time
 */

const Footer = require('../models/Footer.model');
const AppError = require('../utils/AppError');
const mongoose = require('mongoose');

// ============ CONSTANTS ============

/**
 * Populate options for lastEditedBy
 */
const LAST_EDITED_BY_POPULATE = {
  path: 'lastEditedBy',
  select: 'firstName lastName email'
};

/**
 * Valid section names
 */
const VALID_SECTIONS = [
  'logo', 'about-us', 'how-works', 'leadership', 'faq',
  'careers', 'support', 'blogs', 'shipping-returns',
  'privacy-policy', 'terms-conditions', 'consent-telehealth',
  'contact', 'address', 'social-media'
];

// ============ VALIDATION HELPERS ============

/**
 * Validate section ID
 * @param {string} sectionId - Section ID
 */
const ensureValidSectionId = (sectionId) => {
  if (!mongoose.Types.ObjectId.isValid(sectionId)) {
    throw new AppError('Invalid footer section ID', 400);
  }
};

/**
 * Validate section name
 * @param {string} sectionName - Section name
 * @returns {boolean}
 */
const isValidSectionName = (sectionName) => {
  return VALID_SECTIONS.includes(sectionName);
};

// ============ FILTER & SORT HELPERS ============

/**
 * Build filter for footer queries
 * @param {Object} query - Query params
 * @param {boolean} isPublic - Public access
 * @returns {Object} MongoDB filter
 */
const buildFooterFilter = (query = {}, isPublic = false) => {
  const filter = {};
  
  if (isPublic) {
    filter.status = 'published';
  } else if (query.status) {
    filter.status = query.status;
  }
  
  return filter;
};

/**
 * Build sort options
 * @param {Object} query - Query params
 * @returns {Object} MongoDB sort
 */
const buildFooterSort = (query = {}) => {
  const { sortBy = 'order', sortOrder = 'asc' } = query;
  return { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
};

// ============ DUPLICATE CHECK HELPERS ============

/**
 * Check for duplicate section name
 * @param {string} sectionName - Section name
 * @param {string} excludeId - ID to exclude
 */
const checkDuplicateSection = async (sectionName, excludeId = null) => {
  if (!sectionName) return;
  
  const filter = { section: sectionName };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  
  const existing = await Footer.findOne(filter).select('_id').lean();
  if (existing) {
    throw new AppError(`Footer section '${sectionName}' already exists`, 409);
  }
};

// ============ DATA HELPERS ============

/**
 * Apply updates to footer section
 * @param {Object} section - Footer document
 * @param {Object} data - Update data
 * @param {string} userId - User ID
 * @param {boolean} allowSectionChange - Allow section name change
 */
const applyFooterUpdates = (section, data, userId, allowSectionChange = true) => {
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      // Skip section name change if not allowed
      if (key === 'section' && !allowSectionChange) return;
      section[key] = data[key];
    }
  });
  section.lastEditedBy = userId;
};

// ============ OPTIMIZED QUERY HELPERS ============

/**
 * Find section by ID and update with populate (single query)
 * @param {string} sectionId - Section ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - User ID
 * @param {Object} options - Additional options
 * @returns {Object} Updated section
 */
const findByIdAndUpdatePopulate = async (sectionId, updateData, userId, options = {}) => {
  const { checkDuplicate = false, duplicateField = null, excludeId = null } = options;
  
  // Check duplicate if needed
  if (checkDuplicate && duplicateField && updateData[duplicateField]) {
    await checkDuplicateSection(updateData[duplicateField], excludeId || sectionId);
  }
  
  const section = await Footer.findByIdAndUpdate(
    sectionId,
    { 
      ...updateData, 
      lastEditedBy: userId,
      updatedAt: new Date()
    },
    { new: true, runValidators: true }
  )
  .populate(LAST_EDITED_BY_POPULATE)
  .lean();
  
  if (!section) {
    throw new AppError('Footer section not found', 404);
  }
  
  return section;
};

/**
 * Find section by name and update with populate (single query)
 * @param {string} sectionName - Section name
 * @param {Object} updateData - Data to update
 * @param {string} userId - User ID
 * @returns {Object} Updated section
 */
const findByNameAndUpdatePopulate = async (sectionName, updateData, userId) => {
  // Remove section from updateData to prevent changing section name
  const { section, ...safeUpdateData } = updateData;
  
  const footerSection = await Footer.findOneAndUpdate(
    { section: sectionName },
    { 
      ...safeUpdateData, 
      lastEditedBy: userId,
      updatedAt: new Date()
    },
    { new: true, runValidators: true }
  )
  .populate(LAST_EDITED_BY_POPULATE)
  .lean();
  
  if (!footerSection) {
    throw new AppError('Footer section not found', 404);
  }
  
  return footerSection;
};

/**
 * Update section status (publish/draft)
 * @param {string} sectionId - Section ID
 * @param {string} status - New status
 * @param {string} userId - User ID
 * @returns {Object} Updated section
 */
const updateSectionStatus = async (sectionId, status, userId) => {
  return findByIdAndUpdatePopulate(
    sectionId,
    { status },
    userId
  );
};

/**
 * Create section with populate
 * @param {Object} data - Section data
 * @param {string} userId - User ID
 * @returns {Object} Created section
 */
const createSectionWithPopulate = async (data, userId) => {
  // Check duplicate first
  await checkDuplicateSection(data.section);
  
  const section = await Footer.create({
    ...data,
    lastEditedBy: userId
  });
  
  // Fetch with populate
  return await Footer.findById(section._id)
    .populate(LAST_EDITED_BY_POPULATE)
    .lean();
};

/**
 * Get all sections with filter, sort, and populate (optimized single query)
 * @param {Object} query - Query params
 * @param {boolean} isPublic - Public access
 * @returns {Array} Sections
 */
const getAllSectionsOptimized = async (query = {}, isPublic = false) => {
  const filter = buildFooterFilter(query, isPublic);
  const sort = buildFooterSort(query);
  
  return await Footer.find(filter)
    .populate(LAST_EDITED_BY_POPULATE)
    .sort(sort)
    .lean();
};

/**
 * Get section by ID with public/admin access control
 * @param {string} sectionId - Section ID
 * @param {boolean} isPublic - Public access
 * @returns {Object|null} Section or null
 */
const getSectionByIdOptimized = async (sectionId, isPublic = false) => {
  const filter = { _id: sectionId };
  if (isPublic) {
    filter.status = 'published';
  }
  
  return await Footer.findOne(filter)
    .populate(LAST_EDITED_BY_POPULATE)
    .lean();
};

/**
 * Get section by name with public/admin access control
 * @param {string} sectionName - Section name
 * @param {boolean} isPublic - Public access
 * @returns {Object|null} Section or null
 */
const getSectionByNameOptimized = async (sectionName, isPublic = false) => {
  const filter = { section: sectionName };
  if (isPublic) {
    filter.status = 'published';
  }
  
  return await Footer.findOne(filter)
    .populate(LAST_EDITED_BY_POPULATE)
    .lean();
};

/**
 * Delete section by ID
 * @param {string} sectionId - Section ID
 * @returns {Object} Deleted section info
 */
const deleteSectionById = async (sectionId) => {
  const section = await Footer.findByIdAndDelete(sectionId).lean();
  
  if (!section) {
    throw new AppError('Footer section not found', 404);
  }
  
  return {
    message: 'Footer section deleted successfully',
    deletedSection: section.section
  };
};

// ============ ACCESS CONTROL HELPER ============

/**
 * Check if user is admin/sub-admin
 * @param {Object} user - User object from request
 * @returns {boolean} Is public access
 */
const isPublicAccess = (user) => {
  return !user || (user.role !== 'admin' && user.role !== 'sub-admin');
};

module.exports = {
  // Constants
  LAST_EDITED_BY_POPULATE,
  VALID_SECTIONS,
  
  // Validation
  ensureValidSectionId,
  isValidSectionName,
  
  // Filters & Sort
  buildFooterFilter,
  buildFooterSort,
  
  // Duplicate check
  checkDuplicateSection,
  
  // Data helpers
  applyFooterUpdates,
  
  // Optimized queries
  findByIdAndUpdatePopulate,
  findByNameAndUpdatePopulate,
  updateSectionStatus,
  createSectionWithPopulate,
  getAllSectionsOptimized,
  getSectionByIdOptimized,
  getSectionByNameOptimized,
  deleteSectionById,
  
  // Access control
  isPublicAccess
};

