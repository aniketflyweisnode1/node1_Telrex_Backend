const Medicine = require('../../models/Medicine.model');
const AppError = require('../../utils/AppError');

// Add new medicine
exports.addMedicine = async (data, files = [], req = null) => {
  // Prepare product images from uploaded files
  const productImages = files.map(file => {
    // Generate proper URL for the file
    const fileUrl = req 
      ? `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
      : `/uploads/${file.filename}`;
    
    return {
      fileName: file.filename,
      fileUrl: fileUrl,
      fileType: file.mimetype,
      uploadedAt: new Date()
    };
  });

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

  // Create medicine object
  const medicineData = {
    productName: data.productName,
    brand: data.brand,
    originalPrice: parseFloat(data.originalPrice),
    salePrice: parseFloat(data.salePrice),
    productImages: productImages,
    usage: parseIfString(data.usage) || [],
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
    visibility
  } = query;

  const filter = { isActive: true };

  // Search filter
  if (search) {
    filter.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } }
    ];
  }

  // Category filter
  if (category) {
    filter.category = category;
  }

  // Status filter
  if (status) {
    filter.status = status;
  }

  // Visibility filter
  if (visibility !== undefined) {
    filter.visibility = visibility === 'true' || visibility === true;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const medicines = await Medicine.find(filter)
    .sort({ createdAt: -1 })
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
  const medicine = await Medicine.findOne({ _id: medicineId, isActive: true });
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }
  
  return medicine;
};

// Update medicine
exports.updateMedicine = async (medicineId, data, files = [], req = null) => {
  const medicine = await Medicine.findById(medicineId);
  
  if (!medicine) {
    throw new AppError('Medicine not found', 404);
  }

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

  // Update arrays
  if (data.usage !== undefined) medicine.usage = parseIfString(data.usage);
  if (data.generics !== undefined) medicine.generics = parseIfString(data.generics);
  if (data.dosageOptions !== undefined) medicine.dosageOptions = parseIfString(data.dosageOptions);
  if (data.quantityOptions !== undefined) medicine.quantityOptions = parseIfString(data.quantityOptions);
  
  // Update medical information (paragraphs)
  if (data.precautions !== undefined) medicine.precautions = data.precautions;
  if (data.sideEffects !== undefined) medicine.sideEffects = data.sideEffects;
  if (data.drugInteractions !== undefined) medicine.drugInteractions = data.drugInteractions;
  if (data.indications !== undefined) medicine.indications = data.indications;

  // Add new images if provided
  if (files && files.length > 0) {
    const newImages = files.map(file => {
      // Generate proper URL for the file
      const fileUrl = req 
        ? `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
        : `/uploads/${file.filename}`;
      
      return {
        fileName: file.filename,
        fileUrl: fileUrl,
        fileType: file.mimetype,
        uploadedAt: new Date()
      };
    });
    medicine.productImages.push(...newImages);
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

