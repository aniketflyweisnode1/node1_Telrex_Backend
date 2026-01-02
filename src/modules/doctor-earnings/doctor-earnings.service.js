const Doctor = require('../../models/Doctor.model');
const Prescription = require('../../models/Prescription.model');
const DoctorPayout = require('../../models/DoctorPayout.model');
const AppError = require('../../utils/AppError');

// Get doctor earnings summary
exports.getDoctorEarningsSummary = async (query = {}) => {
  const {
    page = 1,
    limit = 10,
    search,
    specialty,
    sortBy = 'totalEarnings',
    sortOrder = 'desc'
  } = query;

  // Build filter
  const filter = { status: 'active', isActive: true };

  if (specialty) {
    filter.specialty = specialty;
  }

  // Search filter (search in doctor name, email)
  if (search) {
    const User = require('../../models/User.model');
    const users = await User.find({
      $or: [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ],
      role: 'doctor'
    }).select('_id');
    
    filter.user = { $in: users.map(u => u._id) };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get all active doctors
  const doctors = await Doctor.find(filter)
    .populate({
      path: 'user',
      select: 'firstName lastName email profilePicture'
    })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Calculate earnings for each doctor
  const doctorsWithEarnings = await Promise.all(
    doctors.map(async (doctor) => {
      const doctorId = doctor._id;

      // Get consultations count (prescriptions count)
      const consultationsCount = await Prescription.countDocuments({ 
        doctor: doctorId,
        status: { $ne: 'cancelled' }
      });

      // Calculate total earnings (consultations * consultationFee)
      const totalEarnings = consultationsCount * (doctor.consultationFee || 0);

      // Get pending payouts (sum of pending/processing payouts)
      const pendingPayouts = await DoctorPayout.aggregate([
        {
          $match: {
            doctor: doctorId,
            status: { $in: ['pending', 'processing'] }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const pendingPayoutAmount = pendingPayouts[0]?.total || 0;

      // Calculate available earnings (total earnings - paid out - pending payouts)
      const completedPayouts = await DoctorPayout.aggregate([
        {
          $match: {
            doctor: doctorId,
            status: 'completed'
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' }
          }
        }
      ]);

      const paidOutAmount = completedPayouts[0]?.total || 0;
      const availableEarnings = totalEarnings - paidOutAmount - pendingPayoutAmount;

      return {
        _id: doctor._id,
        doctor: {
          _id: doctor.user._id,
          firstName: doctor.user.firstName,
          lastName: doctor.user.lastName,
          fullName: `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`,
          email: doctor.user.email,
          profilePicture: doctor.user.profilePicture || doctor.profilePicture
        },
        specialty: doctor.specialty,
        consultations: consultationsCount,
        feesPerHour: doctor.consultationFee,
        totalEarnings: totalEarnings,
        availableEarnings: availableEarnings > 0 ? availableEarnings : 0,
        paidOut: paidOutAmount,
        pendingPayouts: pendingPayoutAmount
      };
    })
  );

  // Sort results
  doctorsWithEarnings.sort((a, b) => {
    if (sortOrder === 'asc') {
      return a[sortBy] - b[sortBy];
    }
    return b[sortBy] - a[sortBy];
  });

  const total = await Doctor.countDocuments(filter);

  return {
    doctors: doctorsWithEarnings,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  };
};

// Get doctor earnings by ID
exports.getDoctorEarningsById = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId)
    .populate({
      path: 'user',
      select: 'firstName lastName email profilePicture'
    })
    .lean();

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  // Get consultations count
  const consultationsCount = await Prescription.countDocuments({ 
    doctor: doctorId,
    status: { $ne: 'cancelled' }
  });

  // Calculate total earnings (consultations * consultationFee)
  const totalEarnings = consultationsCount * doctor.consultationFee;

  // Get payout history
  const payouts = await DoctorPayout.find({ doctor: doctorId })
    .populate('processedBy', 'firstName lastName')
    .sort({ createdAt: -1 })
    .lean();

  const completedPayouts = payouts
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayouts = payouts
    .filter(p => ['pending', 'processing'].includes(p.status))
    .reduce((sum, p) => sum + p.amount, 0);

  const availableEarnings = totalEarnings - completedPayouts - pendingPayouts;

  return {
    doctor: {
      _id: doctor._id,
      user: doctor.user,
      specialty: doctor.specialty,
      consultationFee: doctor.consultationFee,
      profilePicture: doctor.profilePicture || doctor.user.profilePicture
    },
    statistics: {
      consultations: consultationsCount,
      feesPerHour: doctor.consultationFee,
      totalEarnings: totalEarnings,
      availableEarnings: availableEarnings > 0 ? availableEarnings : 0,
      paidOut: completedPayouts,
      pendingPayouts: pendingPayouts
    },
    payouts: payouts
  };
};

// Get doctor bank account information (for payout processing)
exports.getDoctorBankAccount = async (doctorId) => {
  const doctor = await Doctor.findById(doctorId)
    .populate({
      path: 'user',
      select: 'firstName lastName email'
    })
    .lean();

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  // Get available earnings
  const earningsData = await Prescription.aggregate([
    {
      $match: {
        doctor: doctorId,
        status: { $ne: 'cancelled' }
      }
    },
    {
      $lookup: {
        from: 'doctors',
        localField: 'doctor',
        foreignField: '_id',
        as: 'doctorInfo'
      }
    },
    { $unwind: '$doctorInfo' },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$doctorInfo.consultationFee' }
      }
    }
  ]);

  const totalEarnings = earningsData[0]?.totalEarnings || 0;

  const completedPayouts = await DoctorPayout.aggregate([
    {
      $match: {
        doctor: doctorId,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const pendingPayouts = await DoctorPayout.aggregate([
    {
      $match: {
        doctor: doctorId,
        status: { $in: ['pending', 'processing'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const paidOut = completedPayouts[0]?.total || 0;
  const pending = pendingPayouts[0]?.total || 0;
  const availableEarnings = totalEarnings - paidOut - pending;

  // Get latest payout to retrieve bank account info (if exists)
  const latestPayout = await DoctorPayout.findOne({ doctor: doctorId })
    .sort({ createdAt: -1 })
    .lean();

  return {
    doctor: {
      _id: doctor._id,
      name: `${doctor.user.firstName} ${doctor.user.lastName}`,
      email: doctor.user.email
    },
    currentEarnings: availableEarnings > 0 ? availableEarnings : 0,
    bankAccount: latestPayout?.bankAccount || null
  };
};

// Process payout for a doctor
exports.processPayout = async (doctorId, payoutData, processedBy) => {
  const doctor = await Doctor.findById(doctorId)
    .populate({
      path: 'user',
      select: 'firstName lastName email'
    })
    .lean();

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  // Validate amount
  const { amount, bankAccount } = payoutData;

  if (!amount || amount <= 0) {
    throw new AppError('Invalid payout amount', 400);
  }

  // Get available earnings (consultations * consultationFee)
  const consultationsCount = await Prescription.countDocuments({ 
    doctor: doctorId,
    status: { $ne: 'cancelled' }
  });
  
  const totalEarnings = consultationsCount * doctor.consultationFee;

  const completedPayouts = await DoctorPayout.aggregate([
    {
      $match: {
        doctor: doctorId,
        status: 'completed'
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const pendingPayouts = await DoctorPayout.aggregate([
    {
      $match: {
        doctor: doctorId,
        status: { $in: ['pending', 'processing'] }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  const paidOut = completedPayouts[0]?.total || 0;
  const pending = pendingPayouts[0]?.total || 0;
  const availableEarnings = totalEarnings - paidOut - pending;

  if (amount > availableEarnings) {
    throw new AppError(`Insufficient earnings. Available: ${availableEarnings}`, 400);
  }

  // Validate bank account information
  if (!bankAccount || !bankAccount.accountHolder || !bankAccount.bankName || 
      !bankAccount.accountNumber || !bankAccount.routingNumber) {
    throw new AppError('Bank account information is required', 400);
  }

  // Create payout record
  const payout = await DoctorPayout.create({
    doctor: doctorId,
    amount: amount,
    currency: payoutData.currency || 'USD',
    bankAccount: {
      accountHolder: bankAccount.accountHolder,
      bankName: bankAccount.bankName,
      accountNumber: bankAccount.accountNumber,
      routingNumber: bankAccount.routingNumber,
      accountType: bankAccount.accountType || 'checking'
    },
    status: 'pending',
    payoutMethod: payoutData.payoutMethod || 'bank_transfer',
    payoutGateway: payoutData.payoutGateway || 'manual',
    processedBy: processedBy,
    notes: payoutData.notes
  });

  return await DoctorPayout.findById(payout._id)
    .populate('doctor', 'user specialty')
    .populate('processedBy', 'firstName lastName')
    .populate({
      path: 'doctor',
      populate: {
        path: 'user',
        select: 'firstName lastName email'
      }
    })
    .lean();
};

// Update payout status
exports.updatePayoutStatus = async (payoutId, status, transactionId = null, failureReason = null) => {
  const payout = await DoctorPayout.findById(payoutId);
  
  if (!payout) {
    throw new AppError('Payout not found', 404);
  }

  payout.status = status;
  
  if (status === 'completed') {
    payout.processedAt = new Date();
    if (transactionId) payout.transactionId = transactionId;
  } else if (status === 'failed') {
    payout.failedAt = new Date();
    if (failureReason) payout.failureReason = failureReason;
  }

  await payout.save();

  return await DoctorPayout.findById(payoutId)
    .populate('doctor', 'user specialty')
    .populate('processedBy', 'firstName lastName')
    .lean();
};

