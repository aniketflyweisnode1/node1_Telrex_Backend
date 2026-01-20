const Prescription = require('../../models/Prescription.model');
const Order = require('../../models/Order.model');
const Payment = require('../../models/Payment.model');
const Medicine = require('../../models/Medicine.model');
const DoctorPayout = require('../../models/DoctorPayout.model');
const AppError = require('../../utils/AppError');

// Helper function to get date range
const getDateRange = (period = 'last_30_days') => {
  const now = new Date();
  let startDate, endDate = new Date(now);

  switch (period) {
    case 'last_7_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'last_30_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'last_90_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 90);
      break;
    case 'last_365_days':
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 365);
      break;
    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'last_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      break;
    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
  }

  return { startDate, endDate };
};

// Get Consultation Activity Report
exports.getConsultationActivity = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    period = 'last_30_days',
    startDate: customStartDate,
    endDate: customEndDate,
    doctorId,
    patientId,
    search
  } = query;

  const dateFilter = {};
  
  if (customStartDate || customEndDate) {
    dateFilter.createdAt = {};
    if (customStartDate) dateFilter.createdAt.$gte = new Date(customStartDate);
    if (customEndDate) dateFilter.createdAt.$lte = new Date(customEndDate);
  } else {
    const { startDate, endDate } = getDateRange(period);
    dateFilter.createdAt = { $gte: startDate, $lte: endDate };
  }

  const filter = { ...dateFilter };

  if (doctorId) {
    filter.doctor = doctorId;
  }

  if (patientId) {
    filter.patient = patientId;
  }

  if (search) {
    filter.$or = [
      { prescriptionNumber: { $regex: search, $options: 'i' } },
      { diagnosis: { $regex: search, $options: 'i' } }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const prescriptions = await Prescription.find(filter)
    .populate({
      path: 'doctor',
      select: 'user specialty profilePicture profileImage',
      populate: [
        {
          path: 'user',
          select: 'firstName lastName email profilePicture profileImage'
        },
        {
          path: 'specialty',
          select: 'name'
        }
      ]
    })
    .populate({
      path: 'patient',
      select: 'user',
      populate: {
        path: 'user',
        select: 'firstName lastName email'
      }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Prescription.countDocuments(filter);

  const data = prescriptions.map((prescription, index) => {
    const doctor = prescription.doctor || {};
    const doctorUser = doctor.user || {};
  
    const patient = prescription.patient || {};
    const patientUser = patient.user || {};
  
    // Format prescription ID - use prescriptionNumber if available, otherwise generate rx format
    // For UI display, prefer shorter format
    let prescriptionId;
    if (prescription.prescriptionNumber) {
      // Convert PRES1234567890 to rx1234567890 or keep original
      prescriptionId = prescription.prescriptionNumber.startsWith('PRES') 
        ? prescription.prescriptionNumber.replace('PRES', 'rx')
        : prescription.prescriptionNumber;
    } else {
      // Generate simple rx format based on index and timestamp
      const uniqueId = (total - skip - index).toString().padStart(3, '0');
      prescriptionId = `rx${uniqueId}`;
    }
  
    // Get doctor name with proper formatting
    // Handle case where doctor might be null or not populated
    let doctorName = 'N/A';
    if (doctor && doctor._id) {
      if (doctorUser && doctorUser.firstName) {
        doctorName = doctorUser.firstName && doctorUser.lastName
          ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`
          : `Dr. ${doctorUser.firstName}`;
      }
    }
  
    // Get patient name
    const patientName = patientUser.firstName && patientUser.lastName
      ? `${patientUser.firstName} ${patientUser.lastName}`
      : patientUser.firstName || 'N/A';
  
    // Get profile picture - check multiple possible locations
    // Handle case where doctor might be null
    let profilePicture = null;
    if (doctor && doctor._id) {
      profilePicture = doctorUser?.profilePicture 
        || doctorUser?.profileImage?.url 
        || doctor?.profilePicture 
        || doctor?.profileImage?.url
        || null;
    }
  
    // Get diagnosis from prescription description or use medicine name
    // Since Prescription model doesn't have diagnosis field, use description or medicine name
    // Format it properly for UI display
    let diagnosis = prescription.diagnosis;
    if (!diagnosis) {
      // If diagnosis field doesn't exist, try to extract from description
      if (prescription.description) {
        // Try to extract diagnosis from description (first line or first 50 chars)
        diagnosis = prescription.description.split('\n')[0].substring(0, 50) || prescription.description.substring(0, 50);
      } else if (prescription.medicine) {
        // Use medicine name as fallback
        diagnosis = prescription.medicine;
      } else {
        diagnosis = 'N/A';
      }
    }
  
    // Format date to YYYY-MM-DD format for UI
    const date = prescription.createdAt 
      ? new Date(prescription.createdAt).toISOString().split('T')[0]
      : null;
  
    return {
      prescriptionId: prescriptionId,
  
      doctor: doctor && doctor._id ? {
        _id: doctor._id,
        name: doctorName,
        email: doctorUser?.email || 'N/A',
        profilePicture: profilePicture,
        specialty: doctor.specialty?.name || (typeof doctor.specialty === 'string' ? doctor.specialty : null) || null
      } : null,
  
      patient: {
        _id: patient._id || null,
        name: patientName,
        email: patientUser.email || 'N/A'
      },
  
      diagnosis: diagnosis,
      date: date,
      status: prescription.status || 'active',
      medications: prescription.medications || [],
      followUpDate: prescription.followUpDate || null
    };
  });
  

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get Prescriptions & Orders Report
exports.getPrescriptionsAndOrders = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    period = 'last_30_days',
    startDate: customStartDate,
    endDate: customEndDate,
    type, // 'prescriptions', 'orders', 'all'
    status,
    search
  } = query;

  const dateFilter = {};
  
  if (customStartDate || customEndDate) {
    dateFilter.createdAt = {};
    if (customStartDate) dateFilter.createdAt.$gte = new Date(customStartDate);
    if (customEndDate) dateFilter.createdAt.$lte = new Date(customEndDate);
  } else {
    const { startDate, endDate } = getDateRange(period);
    dateFilter.createdAt = { $gte: startDate, $lte: endDate };
  }

  let prescriptions = [];
  let orders = [];

  // Get Prescriptions
  if (!type || type === 'all' || type === 'prescriptions') {
    const prescriptionFilter = { ...dateFilter };
    if (status) prescriptionFilter.status = status;
    if (search) {
      prescriptionFilter.$or = [
        { prescriptionNumber: { $regex: search, $options: 'i' } },
        { diagnosis: { $regex: search, $options: 'i' } }
      ];
    }

    prescriptions = await Prescription.find(prescriptionFilter)
      .populate({
        path: 'doctor',
        select: 'user specialty profilePicture profileImage',
        populate: [
          {
            path: 'user',
            select: 'firstName lastName email profilePicture profileImage'
          },
          {
            path: 'specialty',
            select: 'name'
          }
        ]
      })
      .populate({
        path: 'patient',
        select: 'user',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 2)
      .lean();
  }

  // Get Orders
  if (!type || type === 'all' || type === 'orders') {
    const orderFilter = { ...dateFilter };
    if (status) orderFilter.status = status;
    if (search) {
      orderFilter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // First get orders with basic populate
    orders = await Order.find(orderFilter)
      .populate({
        path: 'patient',
        select: 'user',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate('prescription')
      .populate({
        path: 'shippingAddress',
        select: 'streetAddress city state zipCode'
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 2)
      .lean();

    // Manually populate prescription.doctor for all orders
    const Doctor = require('../../models/Doctor.model');
    orders = await Promise.all(orders.map(async (order) => {
      if (order.prescription && order.prescription.doctor) {
        // If doctor is just an ID, populate it fully
        const doctorId = typeof order.prescription.doctor === 'string' 
          ? order.prescription.doctor 
          : order.prescription.doctor._id;
        
        if (doctorId) {
          const doctor = await Doctor.findById(doctorId)
            .populate({
              path: 'user',
              select: 'firstName lastName email profilePicture profileImage'
            })
            .populate({
              path: 'specialty',
              select: 'name'
            })
            .select('user specialty profilePicture profileImage')
            .lean();
          
          if (doctor) {
            order.prescription.doctor = doctor;
          }
        }
      }
      return order;
    }));
  }

  // Helper function to format prescription ID
  const formatPrescriptionId = (prescriptionNumber) => {
    if (!prescriptionNumber) return null;
    // Format: PRE-001 RX-12345
    if (prescriptionNumber.startsWith('PRES')) {
      const num = prescriptionNumber.replace('PRES', '');
      return `PRE-001 RX-${num.substring(num.length - 5)}`;
    }
    return prescriptionNumber;
  };

  // Helper function to map status for UI
  const mapStatus = (status) => {
    const statusMap = {
      'pending': 'Pending',
      'processing': 'Processing',
      'confirmed': 'Processing',
      'shipped': 'Dispatched',
      'dispatched': 'Dispatched',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled',
      'active': 'Pending',
      'completed': 'Delivered'
    };
    return statusMap[status?.toLowerCase()] || status || 'Pending';
  };

  // Helper function to get pharmacy name
  const getPharmacy = (order) => {
    // You can customize this based on your pharmacy logic
    // For now, use a default or extract from address
    if (order?.shippingAddress) {
      // You might want to add pharmacy field to order or address
      return 'Central Pharmacy'; // Default or extract from address
    }
    return 'Central Pharmacy'; // Default pharmacy name
  };

  // Helper function to get diagnosis from prescription
  const getDiagnosis = (prescription) => {
    if (prescription?.diagnosis) {
      return prescription.diagnosis;
    }
    if (prescription?.description) {
      // Extract first line or first 50 chars
      const firstLine = prescription.description.split('\n')[0];
      return firstLine.substring(0, 50) || prescription.description.substring(0, 50);
    }
    if (prescription?.medicine) {
      return prescription.medicine;
    }
    return 'N/A';
  };

  // Combine and format data
  const combinedData = [
    ...prescriptions.map(p => {
      const doctor = p?.doctor || {};
      const doctorUser = doctor?.user || {};
      const patient = p?.patient || {};
      const patientUser = patient?.user || {};

      // Get doctor name with Dr. prefix
      let doctorName = null;
      let doctorEmail = null;
      let doctorProfilePicture = null;
      
      // Check if doctor exists and is populated
      if (doctor && doctor._id) {
        // Check if user is populated
        if (doctorUser && (doctorUser.firstName || doctorUser.email)) {
          doctorName = doctorUser.firstName && doctorUser.lastName
            ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`
            : doctorUser.firstName
              ? `Dr. ${doctorUser.firstName}`
              : null;
          doctorEmail = doctorUser.email || null;
          doctorProfilePicture = doctorUser.profilePicture 
            || doctorUser.profileImage?.url 
            || doctor.profilePicture 
            || doctor.profileImage?.url
            || null;
        }
      }

      // Get patient name
      const patientName = patientUser.firstName && patientUser.lastName
        ? `${patientUser.firstName} ${patientUser.lastName}`
        : patientUser.firstName || 'N/A';
      const patientEmail = patientUser.email || 'N/A';

      return {
        type: 'prescription',
        prescriptionId: formatPrescriptionId(p?.prescriptionNumber),
        patient: {
          name: patientName,
          email: patientEmail
        },
        doctor: (doctor && doctor._id && doctorName) ? {
          name: doctorName,
          email: doctorEmail || 'N/A',
          profilePicture: doctorProfilePicture
        } : null,
        diagnosis: getDiagnosis(p),
        pharmacy: 'Central Pharmacy', // Default or from prescription
        status: mapStatus(p?.status),
        date: p?.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : null,
        originalData: {
          status: p?.status || 'pending',
          isOrdered: p?.isOrdered || false
        }
      };
    }),
  
    ...orders.map(o => {
      const prescription = o?.prescription || {};
      const doctor = prescription?.doctor || {};
      const doctorUser = doctor?.user || {};
      const patient = o?.patient || {};
      const patientUser = patient?.user || {};

      // Get doctor name with Dr. prefix from prescription
      // Check if doctor exists and is populated
      let doctorName = null;
      let doctorEmail = null;
      let doctorProfilePicture = null;
      
      // Check if doctor exists (not null/undefined) and has _id
      if (doctor && doctor._id) {
        // Check if user is populated
        if (doctorUser && (doctorUser.firstName || doctorUser.email)) {
          doctorName = doctorUser.firstName && doctorUser.lastName
            ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName}`
            : doctorUser.firstName
              ? `Dr. ${doctorUser.firstName}`
              : null;
          doctorEmail = doctorUser.email || null;
          doctorProfilePicture = doctorUser.profilePicture 
            || doctorUser.profileImage?.url 
            || doctor.profilePicture 
            || doctor.profileImage?.url
            || null;
        } else {
          // Doctor exists but user not populated - try to populate it
          // For now, set to null - will be handled separately if needed
          doctorName = null;
          doctorEmail = null;
          doctorProfilePicture = null;
        }
      }

      // Get patient name
      const patientName = patientUser.firstName && patientUser.lastName
        ? `${patientUser.firstName} ${patientUser.lastName}`
        : patientUser.firstName || 'N/A';
      const patientEmail = patientUser.email || 'N/A';

      return {
        type: 'order',
        prescriptionId: formatPrescriptionId(prescription?.prescriptionNumber || o?.orderNumber),
        patient: {
          name: patientName,
          email: patientEmail
        },
        doctor: (doctor && doctor._id && doctorName) ? {
          name: doctorName,
          email: doctorEmail || 'N/A',
          profilePicture: doctorProfilePicture
        } : null,
        diagnosis: getDiagnosis(prescription),
        pharmacy: getPharmacy(o),
        status: mapStatus(o?.status),
        date: o?.createdAt ? new Date(o.createdAt).toISOString().split('T')[0] : null,
        originalData: {
          orderNumber: o?.orderNumber,
          totalAmount: o?.totalAmount || 0,
          status: o?.status || 'pending'
        }
      };
    })
  ];
  

  // Sort by date and paginate
  combinedData.sort((a, b) => new Date(b.date) - new Date(a.date));
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedData = combinedData.slice(skip, skip + parseInt(limit));

  const total = combinedData.length;

  return {
    data: paginatedData,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    },
    summary: {
      prescriptions: prescriptions.length,
      orders: orders.length,
      totalAmount: orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
    }
  };
};

// Get Financial Settlement Report
exports.getFinancialSettlement = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    period = 'last_30_days',
    startDate: customStartDate,
    endDate: customEndDate,
    type, // 'payments', 'payouts', 'all'
    status,
    search
  } = query;

  const dateFilter = {};
  
  if (customStartDate || customEndDate) {
    dateFilter.createdAt = {};
    if (customStartDate) dateFilter.createdAt.$gte = new Date(customStartDate);
    if (customEndDate) dateFilter.createdAt.$lte = new Date(customEndDate);
  } else {
    const { startDate, endDate } = getDateRange(period);
    dateFilter.createdAt = { $gte: startDate, $lte: endDate };
  }

  let payments = [];
  let payouts = [];

  // Get Payments
  if (!type || type === 'all' || type === 'payments') {
    const paymentFilter = { ...dateFilter };
    if (status) paymentFilter.paymentStatus = status;
    if (search) {
      paymentFilter.$or = [
        { paymentId: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }

    payments = await Payment.find(paymentFilter)
      .populate({
        path: 'order',
        select: 'orderNumber patient',
        populate: {
          path: 'patient',
          populate: {
            path: 'user',
            select: 'firstName lastName email'
          }
        }
      })
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 2)
      .lean();
  }

  // Get Payouts
  if (!type || type === 'all' || type === 'payouts') {
    const payoutFilter = { ...dateFilter };
    if (status) payoutFilter.status = status;
    if (search) {
      payoutFilter.$or = [
        { payoutId: { $regex: search, $options: 'i' } },
        { transactionId: { $regex: search, $options: 'i' } }
      ];
    }

    payouts = await DoctorPayout.find(payoutFilter)
      .populate({
        path: 'doctor',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 2)
      .lean();
  }

  // Combine and format data
  const combinedData = [
    ...payments.map(p => ({
      type: 'payment',
      id: p.paymentId || p._id.toString(),
      transactionId: p.paymentId,
      doctor: null,
      patient: p.patient?.user
        ? `${p.patient.user.firstName} ${p.patient.user.lastName}`
        : 'N/A',
      amount: p.amount,
      status: p.paymentStatus,
      paymentMethod: p.paymentMethod,
      date: p.createdAt,
      orderNumber: p.order?.orderNumber || null
    })),
    ...payouts.map(po => ({
      type: 'payout',
      id: po.payoutId || po._id.toString(),
      transactionId: po.payoutId,
      doctor: po.doctor?.user
        ? `Dr. ${po.doctor.user.firstName} ${po.doctor.user.lastName}`
        : 'N/A',
      patient: null,
      amount: po.amount,
      status: po.status,
      paymentMethod: po.payoutMethod,
      date: po.createdAt,
      orderNumber: null
    }))
  ];

  // Sort by date and paginate
  combinedData.sort((a, b) => new Date(b.date) - new Date(a.date));
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedData = combinedData.slice(skip, skip + parseInt(limit));

  const total = combinedData.length;

  return {
    data: paginatedData,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    },
    summary: {
      totalPayments: payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      totalPayouts: payouts.reduce((sum, po) => sum + (po.amount || 0), 0),
      netAmount: payments.reduce((sum, p) => sum + (p.amount || 0), 0) - 
                 payouts.reduce((sum, po) => sum + (po.amount || 0), 0)
    }
  };
};

// Get Pharmacy Inventory Report
exports.getPharmacyInventory = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    brand,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    lowStock // filter for low stock items
  } = query;

  const filter = {};

  if (search) {
    filter.$or = [
      { productName: { $regex: search, $options: 'i' } },
      { brand: { $regex: search, $options: 'i' } }
    ];
  }

  if (brand) {
    filter.brand = brand;
  }

  // If lowStock filter is applied, filter based on inventory status
  if (lowStock === 'true') {
    filter.status = 'low_stock';
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const medicines = await Medicine.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Medicine.countDocuments(filter);

  const data = medicines.map(medicine => {
    // Inventory-based stock status mapping
    let stockStatus = 'instock';
    if (medicine.stock === 0) {
      stockStatus = 'outofstock';
    } else if (medicine.stock > 0 && medicine.stock <= 10) {
      stockStatus = 'lowstock';
    } else {
      stockStatus = 'instock';
    }

    return {
      _id: medicine._id,
      productName: medicine.productName,
      brand: medicine.brand,
      category: medicine.category || null,   // ✅ Added
      originalPrice: medicine.originalPrice,
      salePrice: medicine.salePrice,
      markup: medicine.markup || 0,          // ✅ Added
      dosageOptions: medicine.dosageOptions || [], // ✅ Added
      productImages: medicine.images
        ? {
            thumbnail: medicine.images.thumbnail || null,
            gallery: medicine.images.gallery || []
          }
        : {},
      stock: medicine.stock || 0,
      stockStatus, // ✅ Correct inventory-based status
      createdAt: medicine.createdAt,
      updatedAt: medicine.updatedAt
    };
  });

  // Get unique brands for filter
  const brands = await Medicine.distinct('brand');

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    },
    brands,
    summary: {
      totalProducts: total,
      inStockProducts: await Medicine.countDocuments({ stock: { $gt: 10 } }),
      lowStockProducts: await Medicine.countDocuments({ stock: { $gt: 0, $lte: 10 } }),
      outOfStockProducts: await Medicine.countDocuments({ stock: 0 })
    }
  };
};

