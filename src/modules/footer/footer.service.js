/**
 * Footer Service - Refactored with helpers for optimized queries
 * Maintains exact same API responses for backward compatibility
 * Uses optimized single-query operations for minimum response time
 */

const logger = require('../../utils/logger');
const {
  LAST_EDITED_BY_POPULATE,
  checkDuplicateSection,
  getAllSectionsOptimized,
  getSectionByIdOptimized,
  getSectionByNameOptimized,
  findByIdAndUpdatePopulate,
  findByNameAndUpdatePopulate,
  updateSectionStatus,
  createSectionWithPopulate,
  deleteSectionById
} = require('../../helpers/footer.helper');

// ============ READ OPERATIONS (Optimized) ============

/**
 * Get all footer sections
 * Uses single optimized query with filter, sort, and populate
 */
exports.getAllFooterSections = async (query = {}, isPublic = false) => {
  const sections = await getAllSectionsOptimized(query, isPublic);
  return sections;
};

/**
 * Get footer section by section name
 * Returns null instead of throwing - allows frontend to handle gracefully
 */
exports.getFooterSectionBySection = async (sectionName, isPublic = false) => {
  return await getSectionByNameOptimized(sectionName, isPublic);
};

/**
 * Get footer section by ID
 * Returns null instead of throwing - allows frontend to handle gracefully
 */
exports.getFooterSectionById = async (sectionId, isPublic = false) => {
  return await getSectionByIdOptimized(sectionId, isPublic);
};

// ============ CREATE OPERATION (Optimized) ============

/**
 * Create footer section
 * Uses createSectionWithPopulate for single transaction
 */
exports.createFooterSection = async (data, userId) => {
  const section = await createSectionWithPopulate(data, userId);

  logger.info('Footer section created', {
    sectionId: section._id,
    section: section.section,
    createdBy: userId
  });

  return section;
};

// ============ UPDATE OPERATIONS (Optimized) ============

/**
 * Update footer section by ID
 * Uses findByIdAndUpdatePopulate for single query operation
 */
exports.updateFooterSection = async (sectionId, data, userId) => {
  // Check duplicate if section name is being changed
  if (data.section) {
    await checkDuplicateSection(data.section, sectionId);
  }

  const section = await findByIdAndUpdatePopulate(sectionId, data, userId);

  logger.info('Footer section updated', {
    sectionId: section._id,
    section: section.section,
    updatedBy: userId
  });

  return section;
};

/**
 * Update footer section by section name
 * Uses findByNameAndUpdatePopulate for single query operation
 */
exports.updateFooterSectionBySection = async (sectionName, data, userId) => {
  const section = await findByNameAndUpdatePopulate(sectionName, data, userId);

  logger.info('Footer section updated by section name', {
    sectionId: section._id,
    section: section.section,
    updatedBy: userId
  });

  return section;
};

// ============ DELETE OPERATION (Optimized) ============

/**
 * Delete footer section
 * Uses findByIdAndDelete for single query operation
 */
exports.deleteFooterSection = async (sectionId) => {
  const result = await deleteSectionById(sectionId);

  logger.info('Footer section deleted', {
    deletedSection: result.deletedSection
  });

  return result;
};

// ============ STATUS OPERATIONS (Optimized) ============

/**
 * Publish footer section
 * Uses updateSectionStatus for single query operation
 */
exports.publishFooterSection = async (sectionId, userId) => {
  const section = await updateSectionStatus(sectionId, 'published', userId);

  logger.info('Footer section published', {
    sectionId: section._id,
    section: section.section,
    publishedBy: userId
  });

  return section;
};

/**
 * Save as draft
 * Uses updateSectionStatus for single query operation
 */
exports.saveAsDraft = async (sectionId, userId) => {
  const section = await updateSectionStatus(sectionId, 'draft', userId);

  logger.info('Footer section saved as draft', {
    sectionId: section._id,
    section: section.section,
    savedBy: userId
  });

  return section;
};
