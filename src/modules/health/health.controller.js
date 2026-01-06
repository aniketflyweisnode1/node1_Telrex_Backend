const healthService = require('./health.service');

// Get all health categories
exports.getAllHealthCategories = async (req, res, next) => {
  try {
    const result = await healthService.getAllHealthCategories(req.query);
    res.status(200).json({
      success: true,
      message: 'Health categories retrieved successfully',
      data: result.categories,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get health category by ID
exports.getHealthCategoryById = async (req, res, next) => {
  try {
    const category = await healthService.getHealthCategoryById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Health category retrieved successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// Get health category by slug
exports.getHealthCategoryBySlug = async (req, res, next) => {
  try {
    const category = await healthService.getHealthCategoryBySlug(req.params.slug);
    res.status(200).json({
      success: true,
      message: 'Health category retrieved successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// Get types (chronic conditions) for a category
exports.getCategoryTypes = async (req, res, next) => {
  try {
    const result = await healthService.getCategoryTypes(req.params.categoryId);
    res.status(200).json({
      success: true,
      message: 'Category types retrieved successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Get medications by health category ID
exports.getMedicationsByCategoryId = async (req, res, next) => {
  try {
    const result = await healthService.getMedicationsByCategoryId(req.params.categoryId, req.query);
    res.status(200).json({
      success: true,
      message: 'Medications retrieved successfully',
      data: {
        category: result.category,
        medications: result.medications,
        pagination: result.pagination
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get medications with filters
exports.getMedications = async (req, res, next) => {
  try {
    const result = await healthService.getMedications(req.query);
    res.status(200).json({
      success: true,
      message: 'Medications retrieved successfully',
      data: result.medications,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

// Get trendy medications
exports.getTrendyMedications = async (req, res, next) => {
  try {
    const result = await healthService.getTrendyMedications(req.query);
    res.status(200).json({
      success: true,
      message: 'Trendy medications retrieved successfully',
      data: result.medications
    });
  } catch (err) {
    next(err);
  }
};

// Get best offers
exports.getBestOffers = async (req, res, next) => {
  try {
    const result = await healthService.getBestOffers(req.query);
    res.status(200).json({
      success: true,
      message: 'Best offers retrieved successfully',
      data: result.medications
    });
  } catch (err) {
    next(err);
  }
};

// Create health category
exports.createHealthCategory = async (req, res, next) => {
  try {
    const category = await healthService.createHealthCategory(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Health category created successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// Update health category
exports.updateHealthCategory = async (req, res, next) => {
  try {
    const category = await healthService.updateHealthCategory(req.params.id, req.body, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Health category updated successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// Delete health category
exports.deleteHealthCategory = async (req, res, next) => {
  try {
    const result = await healthService.deleteHealthCategory(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Health category deleted successfully',
      data: result
    });
  } catch (err) {
    next(err);
  }
};

// Activate health category
exports.activateHealthCategory = async (req, res, next) => {
  try {
    const category = await healthService.activateHealthCategory(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Health category activated successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// Deactivate health category
exports.deactivateHealthCategory = async (req, res, next) => {
  try {
    const category = await healthService.deactivateHealthCategory(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Health category deactivated successfully',
      data: category
    });
  } catch (err) {
    next(err);
  }
};

// Mark medicine as trendy
exports.markMedicineAsTrendy = async (req, res, next) => {
  try {
    const medicine = await healthService.markMedicineAsTrendy(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Medicine marked as trendy successfully',
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

// Unmark medicine as trendy
exports.unmarkMedicineAsTrendy = async (req, res, next) => {
  try {
    const medicine = await healthService.unmarkMedicineAsTrendy(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Medicine unmarked as trendy successfully',
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

// Mark medicine as best offer
exports.markMedicineAsBestOffer = async (req, res, next) => {
  try {
    const medicine = await healthService.markMedicineAsBestOffer(req.params.id, req.body, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Medicine marked as best offer successfully',
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

// Unmark medicine as best offer
exports.unmarkMedicineAsBestOffer = async (req, res, next) => {
  try {
    const medicine = await healthService.unmarkMedicineAsBestOffer(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Medicine unmarked as best offer successfully',
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

// Update medicine health category and type
exports.updateMedicineHealthRelation = async (req, res, next) => {
  try {
    const medicine = await healthService.updateMedicineHealthRelation(req.params.id, req.body, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Medicine health relation updated successfully',
      data: medicine
    });
  } catch (err) {
    next(err);
  }
};

