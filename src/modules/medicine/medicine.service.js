const Medicine = require('../../models/Medicine.model');
const HealthCategory = require('../../models/HealthCategory.model');
const AppError = require('../../utils/AppError');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');

// Add new medicine
exports.addMedicine = async (data, files = [], req = null) => {
  // Helper function to parse JSON strings from form data
  const parseIfString = (value) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  };

  // Helper function to normalize usage (handle both old object format and new string format)
  const normalizeUsage = (usage) => {
    if (!usage || !Array.isArray(usage)) {
      return [];
    }
    
    return usage.map(item => {
      // If it's already a string, return it
      if (typeof item === 'string') {
        return item.trim();
      }
      // If it's an object (old format), convert to string
      if (typeof item === 'object' && item !== null) {
        if (item.title && item.description) {
          return `${item.title}: ${item.description}`;
        }
        // If it has description only
        if (item.description) {
          return item.description;
        }
        // If it has title only
        if (item.title) {
          return item.title;
        }
      }
      // Return as string if it's something else
      return String(item);
    }).filter(item => item && item.trim().length > 0);
  };

  // Handle images - from JSON body or file uploads
  let imagesData = {
    thumbnail: '',
    gallery: []
  };

  // If images provided in JSON body
  if (data.images) {
    const imagesInput = parseIfString(data.images);
    if (typeof imagesInput === 'object' && imagesInput !== null) {
      imagesData = {
        thumbnail: imagesInput.thumbnail || '',
        gallery: Array.isArray(imagesInput.gallery) ? imagesInput.gallery : []
      };
    }
  }

  // If files uploaded, handle thumbnail and gallery separately
  if (files && files.length > 0) {
    // Check if there's a specific thumbnail file (fieldname='thumbnail' or filename contains 'thumbnail')
    const thumbnailFile = files.find(file => 
      file.fieldname === 'thumbnail' || 
      file.originalname.toLowerCase().includes('thumbnail')
    ) || files[0];
    
    // All other files go to gallery (excluding thumbnail if it was found separately)
    const galleryFiles = files.filter(file => file !== thumbnailFile);
    
    const thumbnailUrl = req 
      ? `${req.protocol}://${req.get('host')}/uploads/${thumbnailFile.filename}`
      : `/uploads/${thumbnailFile.filename}`;
    
    const galleryUrls = galleryFiles.map(file => {
      return req 
        ? `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
        : `/uploads/${file.filename}`;
    });
    
    // If JSON body already provided thumbnail, keep it; otherwise use uploaded thumbnail
    if (!imagesData.thumbnail) {
      imagesData.thumbnail = thumbnailUrl;
    }
    
    // Add gallery images (merge with existing if any, avoid duplicates)
    const existingGallery = imagesData.gallery || [];
    imagesData.gallery = [...existingGallery, ...galleryUrls];
  }

  // Validate healthCategory and healthTypeSlug relationship
  // If healthTypeSlug is provided, healthCategory MUST be provided
  if (data.healthTypeSlug && !data.healthCategory) {
    throw new AppError('Health category is required when health type slug is provided', 400);
  }

  // Validate healthCategory if provided
  if (data.healthCategory) {
    if (!mongoose.Types.ObjectId.isValid(data.healthCategory)) {
      throw new AppError('Invalid health category ID', 400);
    }

    const healthCategory = await HealthCategory.findById(data.healthCategory);
    if (!healthCategory || !healthCategory.isActive) {
      throw new AppError('Health category not found or inactive', 404);
    }

    // Validate healthTypeSlug if provided - must exist in the selected category's types
    if (data.healthTypeSlug) {
      const typeExists = healthCategory.types.some(
        type => type.slug === data.healthTypeSlug && type.isActive
      );
      if (!typeExists) {
        throw new AppError(`Health type "${data.healthTypeSlug}" not found in the selected category "${healthCategory.name}". Available types: ${healthCategory.types.filter(t => t.isActive).map(t => t.slug).join(', ')}`, 404);
      }
    }
  }

  // Create medicine object
  const medicineData = {
    productName: data.productName,
    brand: data.brand,
    originalPrice: parseFloat(data.originalPrice),
    salePrice: parseFloat(data.salePrice),
    images: imagesData,
    usage: normalizeUsage(parseIfString(data.usage)) || [],
    description: data.description || '',
    howItWorks: data.howItWorks || '',
    generics: parseIfString(data.generics) || [],
    dosageOptions: parseIfString(data.dosageOptions) || [],
    quantityOptions: parseIfString(data.quantityOptions) || [],
    precautions: data.precautions || '',
    sideEffects: data.sideEffects || '',
    drugInteractions: data.drugInteractions || '',
    indications: data.indications || '',
    category: data.category || '',
    healthCategory: data.healthCategory || undefined,
    healthTypeSlug: data.healthTypeSlug || undefined,
    isTrendy: data.isTrendy !== undefined ? (data.isTrendy === 'true' || data.isTrendy === true) : false,
    isBestOffer: data.isBestOffer !== undefined ? (data.isBestOffer === 'true' || data.isBestOffer === true) : false,
    discountPercentage: data.discountPercentage !== undefined ? parseFloat(data.discountPercentage) : undefined,
    markup: data.markup !== undefined ? parseFloat(data.markup) : 0,
    stock: data.stock ? parseInt(data.stock) : 0,
    status: data.status || 'in_stock',
    visibility: data.visibility !== undefined ? data.visibility === 'true' || data.visibility === true : true
  };

  // Determine status based on stock if not provided
  if (!data.status && medicineData.stock !== undefined) {
    if (medicineData.stock === 0) {
      medicineData.status = 'out_of_stock';
    } else if (medicineData.stock < 20) {
      medicineData.status = 'low_stock';
    } else {
      medicineData.status = 'in_stock';
    }
  }

  const medicine = await Medicine.create(medicineData);
  
  // Populate healthCategory if it exists
  if (medicine.healthCategory) {
    await medicine.populate({
      path: 'healthCategory',
      select: 'name slug description icon types'
    });
  }
  
  return medicine;
};

// Get all medicines
exports.getAllMedicines = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    category,
    status,
    visibility,
    availability, // Filter by availability: 'in_stock', 'out_of_stock', 'all'
    inStock, // Boolean: true for in-stock items only
    sortBy = 'createdAt', // Sort field: createdAt, productName, salePrice, originalPrice
    sortOrder = 'desc' // Sort order: asc, desc
  } = query;

  const filter = { isActive: true };

  // Search filter
  if (search) {
    filter.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } },
      { category: { $regex: search, $options: 'i' } },
      { generics: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Availability filter (priority: availability > inStock > status)
  if (availability) {
    if (availability === 'in_stock') {
      filter.status = 'in_stock';
    } else if (availability === 'out_of_stock') {
      filter.status = 'out_of_stock';
    } else if (availability === 'low_stock') {
      filter.status = 'low_stock';
    } else if (availability === 'available') {
      // Available = in_stock or low_stock
      filter.status = { $in: ['in_stock', 'low_stock'] };
    }
  } else if (inStock === 'true' || inStock === true) {
    // Filter for in-stock items only
    filter.status = { $in: ['in_stock', 'low_stock'] };
  } else if (status) {
    // Status filter (if availability and inStock not provided)
    filter.status = status;
  }

  // Visibility filter
  if (visibility !== undefined) {
    filter.visibility = visibility === 'true' || visibility === true;
  }

  // For public access, only show visible medicines
  if (visibility === undefined) {
    filter.visibility = true;
  }

  // Sorting
  const sort = {};
  if (sortBy === 'price_low' || sortBy === 'price_asc') {
    sort.salePrice = 1; // Low to high
  } else if (sortBy === 'price_high' || sortBy === 'price_desc') {
    sort.salePrice = -1; // High to low
  } else if (sortBy === 'name' || sortBy === 'productName') {
    sort.productName = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'price' || sortBy === 'salePrice') {
    sort.salePrice = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'originalPrice') {
    sort.originalPrice = sortOrder === 'desc' ? -1 : 1;
  } else {
    // Default sorting
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const medicines = await Medicine.find(filter)
    .populate({
      path: 'healthCategory',
      select: 'name slug description icon types',
      match: { isActive: true }
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Medicine.countDocuments(filter);

  return {
    medicines,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get medicine by ID
exports.getMedicineById = async (medicineId) => {
  const medicine = await Medicine.findOne({ _id: medicineId, isActive: true })
    .populate({
      path: 'healthCategory',
      select: 'name slug description icon types',
      match: { isActive: true }
    })
    .lean();
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }
  
  // For public access, only return if visible
  if (medicine.visibility === false) {
    throw new AppError('Medicine not found', 404);
  }
  
  return medicine;
};

// Find similar medicines
exports.findSimilarMedicines = async (medicineId, options = {}) => {
  const limit = parseInt(options.limit) || 10;
  
  // Get the original medicine
  const originalMedicine = await Medicine.findOne({ 
    _id: medicineId, 
    isActive: true,
    visibility: true 
  }).lean();
  
  if (!originalMedicine) {
    throw new AppError('Medicine not found', 404);
  }
  
  // Build similarity criteria
  const similarityCriteria = [];
  
  // 1. Same health category (highest priority)
  if (originalMedicine.healthCategory) {
    similarityCriteria.push({
      healthCategory: originalMedicine.healthCategory,
      _id: { $ne: medicineId }
    });
  }
  
  // 2. Same health type slug
  if (originalMedicine.healthTypeSlug) {
    similarityCriteria.push({
      healthTypeSlug: originalMedicine.healthTypeSlug,
      _id: { $ne: medicineId }
    });
  }
  
  // 3. Same category
  if (originalMedicine.category) {
    similarityCriteria.push({
      category: originalMedicine.category,
      _id: { $ne: medicineId }
    });
  }
  
  // 4. Similar generics (if any generics exist)
  if (originalMedicine.generics && originalMedicine.generics.length > 0) {
    similarityCriteria.push({
      generics: { $in: originalMedicine.generics },
      _id: { $ne: medicineId }
    });
  }
  
  // 5. Same brand (lower priority, but still relevant)
  if (originalMedicine.brand) {
    similarityCriteria.push({
      brand: originalMedicine.brand,
      _id: { $ne: medicineId }
    });
  }
  
  // If no criteria found, return empty
  if (similarityCriteria.length === 0) {
    return {
      medicines: [],
      pagination: {
        page: 1,
        limit,
        total: 0,
        pages: 0
      }
    };
  }
  
  // Build base filter
  const baseFilter = {
    _id: { $ne: medicineId },
    isActive: true,
    visibility: true,
    status: { $in: ['in_stock', 'low_stock'] }
  };
  
  // Use $or to find medicines matching any similarity criteria
  // Prioritize by: healthCategory + healthTypeSlug > healthCategory > category > generics > brand
  const filter = {
    ...baseFilter,
    $or: similarityCriteria
  };
  
  // Find similar medicines with priority scoring
  const medicines = await Medicine.find(filter)
    .populate({
      path: 'healthCategory',
      select: 'name slug description icon types',
      match: { isActive: true }
    })
    .lean();
  
  // Score and sort medicines by similarity
  const scoredMedicines = medicines.map(medicine => {
    let score = 0;
    
    // Health category match (highest priority)
    if (medicine.healthCategory && originalMedicine.healthCategory) {
      if (medicine.healthCategory.toString() === originalMedicine.healthCategory.toString()) {
        score += 100;
      }
    }
    
    // Health type slug match
    if (medicine.healthTypeSlug === originalMedicine.healthTypeSlug) {
      score += 50;
    }
    
    // Category match
    if (medicine.category === originalMedicine.category) {
      score += 30;
    }
    
    // Generics match
    if (medicine.generics && originalMedicine.generics) {
      const commonGenerics = medicine.generics.filter(g => 
        originalMedicine.generics.includes(g)
      );
      score += commonGenerics.length * 10;
    }
    
    // Brand match
    if (medicine.brand === originalMedicine.brand) {
      score += 20;
    }
    
    // Price similarity (closer price = higher score)
    const priceDiff = Math.abs(medicine.salePrice - originalMedicine.salePrice);
    const priceSimilarity = Math.max(0, 10 - (priceDiff / originalMedicine.salePrice) * 10);
    score += priceSimilarity;
    
    return { ...medicine, similarityScore: score };
  });
  
  // Sort by similarity score (descending) and then by price
  scoredMedicines.sort((a, b) => {
    if (b.similarityScore !== a.similarityScore) {
      return b.similarityScore - a.similarityScore;
    }
    return a.salePrice - b.salePrice;
  });
  
  // Limit results
  const limitedMedicines = scoredMedicines.slice(0, limit);
  
  // Remove similarityScore from response
  const finalMedicines = limitedMedicines.map(({ similarityScore, ...medicine }) => medicine);
  
  return {
    medicines: finalMedicines,
    pagination: {
      page: 1,
      limit,
      total: finalMedicines.length,
      pages: 1
    }
  };
};

// Update medicine
exports.updateMedicine = async (medicineId, data, files = [], req = null) => {
  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  // Helper function to parse JSON strings from form data
  const parseIfString = (value) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    return value;
  };

  // Update basic fields
  if (data.productName) medicine.productName = data.productName;
  if (data.brand) medicine.brand = data.brand;
  if (data.originalPrice) medicine.originalPrice = parseFloat(data.originalPrice);
  if (data.salePrice) medicine.salePrice = parseFloat(data.salePrice);
  if (data.description !== undefined) medicine.description = data.description;
  if (data.howItWorks !== undefined) medicine.howItWorks = data.howItWorks;
  if (data.category !== undefined) medicine.category = data.category;
  if (data.stock !== undefined) medicine.stock = parseInt(data.stock);
  if (data.status) medicine.status = data.status;
  if (data.visibility !== undefined) {
    medicine.visibility = data.visibility === 'true' || data.visibility === true;
  }

  // Update images from JSON body (if provided)
  if (data.images !== undefined) {
    const imagesInput = parseIfString(data.images);
    if (typeof imagesInput === 'object' && imagesInput !== null) {
      medicine.images = {
        thumbnail: imagesInput.thumbnail || '',
        gallery: Array.isArray(imagesInput.gallery) ? imagesInput.gallery : []
      };
    }
  }

  // Update arrays
  if (data.usage !== undefined) medicine.usage = normalizeUsage(parseIfString(data.usage));
  if (data.generics !== undefined) medicine.generics = parseIfString(data.generics);
  if (data.dosageOptions !== undefined) medicine.dosageOptions = parseIfString(data.dosageOptions);
  if (data.quantityOptions !== undefined) medicine.quantityOptions = parseIfString(data.quantityOptions);
  
  // Update markup
  if (data.markup !== undefined) {
    medicine.markup = parseFloat(data.markup);
  }
  
  // Update medical information (paragraphs)
  if (data.precautions !== undefined) medicine.precautions = data.precautions;
  if (data.sideEffects !== undefined) medicine.sideEffects = data.sideEffects;
  if (data.drugInteractions !== undefined) medicine.drugInteractions = data.drugInteractions;
  if (data.indications !== undefined) medicine.indications = data.indications;

  // Validate and update healthCategory and healthTypeSlug relationship
  // If healthTypeSlug is provided, healthCategory MUST be provided
  if (data.healthTypeSlug !== undefined && !data.healthCategory && !medicine.healthCategory) {
    throw new AppError('Health category is required when health type slug is provided', 400);
  }

  // Validate healthCategory if provided or if healthTypeSlug is provided
  const healthCategoryToValidate = data.healthCategory || (data.healthTypeSlug ? medicine.healthCategory : null);
  
  if (healthCategoryToValidate) {
    if (!mongoose.Types.ObjectId.isValid(healthCategoryToValidate)) {
      throw new AppError('Invalid health category ID', 400);
    }

    const healthCategory = await HealthCategory.findById(healthCategoryToValidate);
    if (!healthCategory || !healthCategory.isActive) {
      throw new AppError('Health category not found or inactive', 404);
    }

    // Validate healthTypeSlug if provided - must exist in the selected category's types
    const healthTypeSlugToValidate = data.healthTypeSlug !== undefined ? data.healthTypeSlug : medicine.healthTypeSlug;
    if (healthTypeSlugToValidate) {
      const typeExists = healthCategory.types.some(
        type => type.slug === healthTypeSlugToValidate && type.isActive
      );
      if (!typeExists) {
        throw new AppError(`Health type "${healthTypeSlugToValidate}" not found in the selected category "${healthCategory.name}". Available types: ${healthCategory.types.filter(t => t.isActive).map(t => t.slug).join(', ')}`, 404);
      }
    }
  }

  // Update healthCategory and healthTypeSlug
  if (data.healthCategory !== undefined) {
    medicine.healthCategory = data.healthCategory || undefined;
  }
  if (data.healthTypeSlug !== undefined) {
    medicine.healthTypeSlug = data.healthTypeSlug || undefined;
  }
  
  // Update admin flags
  if (data.isTrendy !== undefined) {
    medicine.isTrendy = data.isTrendy === 'true' || data.isTrendy === true;
  }
  if (data.isBestOffer !== undefined) {
    medicine.isBestOffer = data.isBestOffer === 'true' || data.isBestOffer === true;
  }
  if (data.discountPercentage !== undefined) {
    if (data.discountPercentage < 0 || data.discountPercentage > 100) {
      throw new AppError('Discount percentage must be between 0 and 100', 400);
    }
    medicine.discountPercentage = parseFloat(data.discountPercentage);
  }

  // Update images from file uploads (if provided)
  if (files && files.length > 0) {
    // Check if there's a specific thumbnail file (fieldname='thumbnail' or filename contains 'thumbnail')
    const thumbnailFile = files.find(file => 
      file.fieldname === 'thumbnail' || 
      file.originalname.toLowerCase().includes('thumbnail')
    ) || files[0];
    
    // All other files go to gallery (excluding thumbnail if it was found separately)
    const galleryFiles = files.filter(file => file !== thumbnailFile);
    
    const thumbnailUrl = req 
      ? `${req.protocol}://${req.get('host')}/uploads/${thumbnailFile.filename}`
      : `/uploads/${thumbnailFile.filename}`;
    
    const galleryUrls = galleryFiles.map(file => {
      return req 
        ? `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
        : `/uploads/${file.filename}`;
    });
    
    // Initialize images object if it doesn't exist
    if (!medicine.images) {
      medicine.images = {
        thumbnail: '',
        gallery: []
      };
    }
    
    // Update thumbnail only if not already set from JSON body
    if (!medicine.images.thumbnail || data.images === undefined) {
      medicine.images.thumbnail = thumbnailUrl;
    }
    
    // Add gallery images (merge with existing, avoid duplicates)
    const existingGallery = medicine.images.gallery || [];
    medicine.images.gallery = [...existingGallery, ...galleryUrls];
  }

  // Update status based on stock if stock was updated
  if (data.stock !== undefined) {
    if (medicine.stock === 0) {
      medicine.status = 'out_of_stock';
    } else if (medicine.stock < 20) {
      medicine.status = 'low_stock';
    } else {
      medicine.status = 'in_stock';
    }
  }

  await medicine.save();
  
  // Populate healthCategory if it exists
  if (medicine.healthCategory) {
    await medicine.populate({
      path: 'healthCategory',
      select: 'name slug description icon types'
    });
  }
  
  return medicine;
};

// Update medicine stock and status
exports.updateMedicineStockStatus = async (medicineId, data) => {
  if (!mongoose.Types.ObjectId.isValid(medicineId)) {
    throw new AppError('Invalid medicine ID', 400);
  }

  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  // Update stock if provided
  if (data.stock !== undefined) {
    medicine.stock = parseInt(data.stock);
    
    // Auto-update status based on stock if status is not explicitly provided
    if (data.status === undefined) {
      if (medicine.stock === 0) {
        medicine.status = 'out_of_stock';
      } else if (medicine.stock < 20) {
        medicine.status = 'low_stock';
      } else {
        medicine.status = 'in_stock';
      }
    }
  }

  // Update status if explicitly provided
  if (data.status !== undefined) {
    const validStatuses = ['in_stock', 'low_stock', 'out_of_stock', 'discontinued'];
    if (!validStatuses.includes(data.status)) {
      throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
    }
    medicine.status = data.status;
  }

  await medicine.save();

  logger.info('Medicine stock and status updated', {
    medicineId: medicine._id,
    productName: medicine.productName,
    stock: medicine.stock,
    status: medicine.status
  });

  // Populate healthCategory if it exists
  if (medicine.healthCategory) {
    await medicine.populate({
      path: 'healthCategory',
      select: 'name slug description icon types'
    });
  }

  return medicine;
};

// Update medicine visibility
exports.updateMedicineVisibility = async (medicineId, visibility) => {
  if (!mongoose.Types.ObjectId.isValid(medicineId)) {
    throw new AppError('Invalid medicine ID', 400);
  }

  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  // Update visibility
  if (visibility !== undefined) {
    medicine.visibility = visibility === true || visibility === 'true';
  } else {
    throw new AppError('Visibility value is required', 400);
  }

  await medicine.save();

  logger.info('Medicine visibility updated', {
    medicineId: medicine._id,
    productName: medicine.productName,
    visibility: medicine.visibility
  });

  // Populate healthCategory if it exists
  if (medicine.healthCategory) {
    await medicine.populate({
      path: 'healthCategory',
      select: 'name slug description icon types'
    });
  }

  return medicine;
};

// Delete medicine (soft delete)
exports.deleteMedicine = async (medicineId) => {
  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

  medicine.isActive = false;
  await medicine.save();
  
  return { message: 'Medicine deleted successfully' };
};

