const Patient = require('../../models/Patient.model');
const User = require('../../models/User.model');
const Prescription = require('../../models/Prescription.model');
const Order = require('../../models/Order.model');
const Chat = require('../../models/Chat.model');
const IntakeForm = require('../../models/IntakeForm.model');
const Address = require('../../models/Address.model');
const HealthRecord = require('../../models/HealthRecord.model');
const Payment = require('../../models/Payment.model');
const AppError = require('../../utils/AppError');

// Calculate age from date of birth
const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

// Get all patients with relations and statistics
exports.getAllPatients = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    status, // 'active' or 'inactive'
    gender,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = query;

  // Build filter
  const filter = {};

  // Status filter
  if (status) {
    filter.isActive = status === 'active';
  }

  // Gender filter
  if (gender) {
    filter.gender = gender;
  }

  // Search filter (search in user's name, email, phone)
  if (search) {
    const users = await User.find({
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phoneNumber: { $regex: search, $options: 'i' } }
      ],
      role: 'patient'
    }).select('_id');
    
    filter.user = { $in: users.map(u => u._id) };
  }

  // Sort
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get patients with user info
  const patients = await Patient.find(filter)
    .populate({
      path: 'user',
      select: 'firstName lastName email phoneNumber countryCode isActive isVerified lastLoginAt'
    })
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Get statistics for each patient
  const patientsWithStats = await Promise.all(
    patients.map(async (patient) => {
      const patientId = patient._id;
      const userId = patient.user._id;

      // Get consultations count (prescriptions count)
      const consultationsCount = await Prescription.countDocuments({ patient: patientId });

      // Get last visit (most recent prescription or order date)
      const lastPrescription = await Prescription.findOne({ patient: patientId })
        .sort({ createdAt: -1 })
        .select('createdAt')
        .lean();
      
      const lastOrder = await Order.findOne({ patient: patientId })
        .sort({ createdAt: -1 })
        .select('createdAt')
        .lean();

      let lastVisit = null;
      if (lastPrescription && lastOrder) {
        lastVisit = lastPrescription.createdAt > lastOrder.createdAt 
          ? lastPrescription.createdAt 
          : lastOrder.createdAt;
      } else if (lastPrescription) {
        lastVisit = lastPrescription.createdAt;
      } else if (lastOrder) {
        lastVisit = lastOrder.createdAt;
      }

      // Get consent status from IntakeForm
      const intakeForm = await IntakeForm.findOne({ patient: patientId })
        .select('basicInformation')
        .lean();
      
      const consent = intakeForm?.basicInformation ? 'Given' : 'Not Given';

      // Calculate age
      const age = calculateAge(patient.dateOfBirth);
      const ageGender = age && patient.gender 
        ? `${age}/${patient.gender.charAt(0).toUpperCase()}` 
        : patient.gender 
          ? `-/${patient.gender.charAt(0).toUpperCase()}` 
          : age 
            ? `${age}/-` 
            : '-/-';

      return {
        ...patient,
        age,
        ageGender,
        consultationsCount,
        lastVisit,
        consent,
        phone: patient.user?.phoneNumber 
          ? `+${patient.user.countryCode} ${patient.user.phoneNumber}` 
          : null
      };
    })
  );

  const total = await Patient.countDocuments(filter);

  return {
    patients: patientsWithStats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get patient by ID with all relations
exports.getPatientById = async (patientId) => {
  const patient = await Patient.findById(patientId)
    .populate({
      path: 'user',
      select: 'firstName lastName email phoneNumber countryCode isActive isVerified lastLoginAt createdAt'
    })
    .lean();

  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  // Get all related data
  const [
    prescriptions,
    orders,
    chats,
    intakeForm,
    addresses,
    healthRecords,
    payments
  ] = await Promise.all([
    Prescription.find({ patient: patientId })
      .populate('doctor', 'firstName lastName')
      .sort({ createdAt: -1 })
      .lean(),
    Order.find({ patient: patientId })
      .populate('prescription', 'prescriptionNumber')
      .populate('shippingAddress')
      .sort({ createdAt: -1 })
      .lean(),
    Chat.find({ patient: patientId })
      .populate('doctor', 'firstName lastName')
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean(),
    IntakeForm.findOne({ patient: patientId }).lean(),
    Address.find({ patient: patientId }).lean(),
    HealthRecord.find({ patient: patientId }).sort({ createdAt: -1 }).lean(),
    Payment.find({ patient: patientId }).sort({ createdAt: -1 }).lean()
  ]);

  // Calculate statistics
  const consultationsCount = prescriptions.length;
  const ordersCount = orders.length;
  const totalSpent = payments
    .filter(p => p.paymentStatus === 'success')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const lastPrescription = prescriptions[0]?.createdAt || null;
  const lastOrder = orders[0]?.createdAt || null;
  const lastVisit = lastPrescription && lastOrder
    ? (lastPrescription > lastOrder ? lastPrescription : lastOrder)
    : lastPrescription || lastOrder;

  const age = calculateAge(patient.dateOfBirth);
  const consent = intakeForm?.basicInformation ? 'Given' : 'Not Given';

  return {
    ...patient,
    age,
    consent,
    statistics: {
      consultationsCount,
      ordersCount,
      totalSpent,
      lastVisit,
      lastPrescription,
      lastOrder
    },
    relations: {
      prescriptions,
      orders,
      chats,
      intakeForm,
      addresses,
      healthRecords,
      payments
    }
  };
};

// Update patient status (activate/deactivate)
exports.updatePatientStatus = async (patientId, isActive) => {
  const patient = await Patient.findById(patientId);
  if (!patient) {
    throw new AppError('Patient not found', 404);
  }

  patient.isActive = isActive;
  await patient.save();

  // Also update user status
  await User.findByIdAndUpdate(patient.user, { isActive });

  return await Patient.findById(patientId)
    .populate({
      path: 'user',
      select: 'firstName lastName email phoneNumber countryCode isActive isVerified'
    })
    .lean();
};

// Get patient statistics summary
exports.getPatientStatistics = async () => {
  const [
    totalPatients,
    activePatients,
    inactivePatients,
    totalConsultations,
    totalOrders,
    totalRevenue
  ] = await Promise.all([
    Patient.countDocuments(),
    Patient.countDocuments({ isActive: true }),
    Patient.countDocuments({ isActive: false }),
    Prescription.countDocuments(),
    Order.countDocuments(),
    Payment.aggregate([
      { $match: { paymentStatus: 'success' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
  ]);

  return {
    totalPatients,
    activePatients,
    inactivePatients,
    totalConsultations,
    totalOrders,
    totalRevenue: totalRevenue[0]?.total || 0
  };
};

