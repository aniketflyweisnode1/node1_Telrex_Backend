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
      populate: {
        path: 'user',
        select: 'firstName lastName email profilePicture'
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
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  const total = await Prescription.countDocuments(filter);

  const data = prescriptions.map(prescription => {
    const doctor = prescription.doctor || {};
    const doctorUser = doctor.user || {};
  
    const patient = prescription.patient || {};
    const patientUser = patient.user || {};
  
    return {
      prescriptionId: prescription.prescriptionNumber,
  
      doctor: {
        _id: doctor._id || null,
        name: doctorUser.firstName
          ? `Dr. ${doctorUser.firstName} ${doctorUser.lastName || ''}`
          : 'N/A',
        email: doctorUser.email || 'N/A',
        profilePicture: doctorUser.profilePicture || doctor.profilePicture || null,
        specialty: doctor.specialty || 'N/A'
      },
  
      patient: {
        _id: patient._id || null,
        name: patientUser.firstName
          ? `${patientUser.firstName} ${patientUser.lastName || ''}`
          : 'N/A',
        email: patientUser.email || 'N/A'
      },
  
      diagnosis: prescription.diagnosis || null,
      date: prescription.createdAt,
      status: prescription.status,
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
        populate: {
          path: 'user',
          select: 'firstName lastName email'
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

  // Get Orders
  if (!type || type === 'all' || type === 'orders') {
    const orderFilter = { ...dateFilter };
    if (status) orderFilter.orderStatus = status;
    if (search) {
      orderFilter.$or = [
        { orderNumber: { $regex: search, $options: 'i' } }
      ];
    }

    orders = await Order.find(orderFilter)
      .populate({
        path: 'patient',
        populate: {
          path: 'user',
          select: 'firstName lastName email'
        }
      })
      .populate('prescription')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) * 2)
      .lean();
  }

  // Combine and format data
  const combinedData = [
    ...prescriptions.map(p => ({
      type: 'prescription',
      id: p?.prescriptionNumber || null,
      prescriptionId: p?.prescriptionNumber || null,
      orderId: null,
  
      doctor:
        p?.doctor && p?.doctor?.user
          ? `Dr. ${p.doctor.user.firstName || ""} ${p.doctor.user.lastName || ""}`
          : 'N/A',
  
      patient:
        p?.patient && p?.patient?.user
          ? `${p.patient.user.firstName || ""} ${p.patient.user.lastName || ""}`
          : 'N/A',
  
      diagnosis: p?.diagnosis || null,
      items: Array.isArray(p?.medications) ? p.medications.length : 0,
      totalAmount: 0,
      status: p?.status || 'pending',
      date: p?.createdAt || null,
      isOrdered: p?.isOrdered || false
    })),
  
    ...orders.map(o => ({
      type: 'order',
      id: o?.orderNumber || null,
      prescriptionId: o?.prescription?.prescriptionNumber || null,
      orderId: o?.orderNumber || null,
      doctor: null,
  
      patient:
        o?.patient && o?.patient?.user
          ? `${o.patient.user.firstName || ""} ${o.patient.user.lastName || ""}`
          : 'N/A',
  
      diagnosis: null,
      items: Array.isArray(o?.items) ? o.items.length : 0,
      totalAmount: o?.totalAmount || 0,
      status: o?.orderStatus || 'pending',
      date: o?.createdAt || null,
      isOrdered: true
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

