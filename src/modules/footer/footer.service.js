const Footer = require('../../models/Footer.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

// Get all footer sections
exports.getAllFooterSections = async (query = {}) => {
  const { status, sortBy = 'order', sortOrder = 'asc' } = query;

  const filter = {};
  if (status) {
    filter.status = status;
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const sections = await Footer.find(filter)
    .populate({
      path: 'lastEditedBy',
      select: 'firstName lastName email'
    })
    .sort(sort)
    .lean();

  return sections;
};

// Get footer section by section name
exports.getFooterSectionBySection = async (sectionName) => {
  const section = await Footer.findOne({ section: sectionName })
    .populate({
      path: 'lastEditedBy',
      select: 'firstName lastName email'
    })
    .lean();

  if (!section) {
    throw new AppError('Footer section not found', 404);
  }

  return section;
};

// Get footer section by ID
exports.getFooterSectionById = async (sectionId) => {
  const section = await Footer.findById(sectionId)
    .populate({
      path: 'lastEditedBy',
      select: 'firstName lastName email'
    })
    .lean();

  if (!section) {
    throw new AppError('Footer section not found', 404);
  }

  return section;
};

// Create footer section
exports.createFooterSection = async (data, userId) => {
  // Check if section already exists
  const existingSection = await Footer.findOne({ section: data.section });
  if (existingSection) {
    throw new AppError(`Footer section '${data.section}' already exists`, 409);
  }

  const sectionData = {
    ...data,
    lastEditedBy: userId
  };

  const section = await Footer.create(sectionData);

  logger.info('Footer section created', {
    sectionId: section._id,
    section: section.section,
    createdBy: userId
  });

  return await Footer.findById(section._id)
    .populate({
      path: 'lastEditedBy',
      select: 'firstName lastName email'
    })
    .lean();
};

// Update footer section
exports.updateFooterSection = async (sectionId, data, userId) => {
  const section = await Footer.findById(sectionId);
  if (!section) {
    throw new AppError('Footer section not found', 404);
  }

  // If section name is being changed, check for duplicates
  if (data.section && data.section !== section.section) {
    const existingSection = await Footer.findOne({ section: data.section });
    if (existingSection) {
      throw new AppError(`Footer section '${data.section}' already exists`, 409);
    }
  }

  // Update fields
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined) {
      section[key] = data[key];
    }
  });

  section.lastEditedBy = userId;
  await section.save();

  logger.info('Footer section updated', {
    sectionId: section._id,
    section: section.section,
    updatedBy: userId
  });

  return await Footer.findById(section._id)
    .populate({
      path: 'lastEditedBy',
      select: 'firstName lastName email'
    })
    .lean();
};

// Update footer section by section name
exports.updateFooterSectionBySection = async (sectionName, data, userId) => {
  const section = await Footer.findOne({ section: sectionName });
  if (!section) {
    throw new AppError('Footer section not found', 404);
  }

  // Update fields
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && key !== 'section') {
      section[key] = data[key];
    }
  });

  section.lastEditedBy = userId;
  await section.save();

  logger.info('Footer section updated by section name', {
    sectionId: section._id,
    section: section.section,
    updatedBy: userId
  });

  return await Footer.findById(section._id)
    .populate({
      path: 'lastEditedBy',
      select: 'firstName lastName email'
    })
    .lean();
};

// Delete footer section
exports.deleteFooterSection = async (sectionId) => {
  const section = await Footer.findById(sectionId);
  if (!section) {
    throw new AppError('Footer section not found', 404);
  }

  await Footer.findByIdAndDelete(sectionId);

  logger.info('Footer section deleted', {
    sectionId: section._id,
    section: section.section
  });

  return { message: 'Footer section deleted successfully' };
};

// Publish footer section
exports.publishFooterSection = async (sectionId, userId) => {
  const section = await Footer.findById(sectionId);
  if (!section) {
    throw new AppError('Footer section not found', 404);
  }

  section.status = 'published';
  section.lastEditedBy = userId;
  await section.save();

  logger.info('Footer section published', {
    sectionId: section._id,
    section: section.section,
    publishedBy: userId
  });

  return await Footer.findById(section._id)
    .populate({
      path: 'lastEditedBy',
      select: 'firstName lastName email'
    })
    .lean();
};

// Save as draft
exports.saveAsDraft = async (sectionId, userId) => {
  const section = await Footer.findById(sectionId);
  if (!section) {
    throw new AppError('Footer section not found', 404);
  }

  section.status = 'draft';
  section.lastEditedBy = userId;
  await section.save();

  logger.info('Footer section saved as draft', {
    sectionId: section._id,
    section: section.section,
    savedBy: userId
  });

  return await Footer.findById(section._id)
    .populate({
      path: 'lastEditedBy',
      select: 'firstName lastName email'
    })
    .lean();
};

