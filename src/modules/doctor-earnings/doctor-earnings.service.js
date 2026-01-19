const Doctor = require('../../models/Doctor.model');
const Prescription = require('../../models/Prescription.model');
const DoctorPayout = require('../../models/DoctorPayout.model');
const IntakeForm = require('../../models/IntakeForm.model');
const AppError = require('../../utils/AppError');
const logger = require('../../utils/logger');

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

  // Get all active doctors with complete details populated (for admin panel)
  const doctors = await Doctor.find(filter)
    .populate({
      path: 'user',
      select: 'firstName lastName email phoneNumber countryCode profilePicture role isActive createdAt gender dateOfBirth'
    })
    .populate({
      path: 'specialty',
      select: 'name description'
    })
    .populate({
      path: 'createdBy',
      select: 'firstName lastName email'
    })
    .populate({
      path: 'licenseVerifiedBy',
      select: 'firstName lastName email'
    })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Calculate earnings for each doctor
  const doctorsWithEarnings = await Promise.all(
    doctors.map(async (doctor) => {
      const doctorId = doctor._id;

      // Get consultations count (IntakeForm with status 'submitted' assigned to this doctor)
      const consultationsCount = await IntakeForm.countDocuments({ 
        doctor: doctorId,
        status: 'submitted'
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

      // Format response to match image table structure exactly with complete doctor details
      // Image shows: Doctor (name, picture, email) | Specialty | Consultations | Fees/Hr | Total Earnings | Actions
      // UI shows "--" when consultations or fees are empty, so format accordingly
      return {
        _id: doctor._id,
        doctorId: doctor._id.toString(),
        // Doctor Details (Complete Information for Admin Panel)
        doctor: {
          _id: doctor.user?._id?.toString() || null,
          firstName: doctor.user?.firstName || '',
          lastName: doctor.user?.lastName || '',
          fullName: doctor.user?.firstName && doctor.user?.lastName
            ? `${doctor.user.firstName} ${doctor.user.lastName}`
            : doctor.user?.email || 'Unknown',
          displayName: doctor.user?.firstName && doctor.user?.lastName
            ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`
            : doctor.user?.email || 'Unknown',
          email: doctor.user?.email || '',
          phoneNumber: doctor.user?.phoneNumber || '',
          countryCode: doctor.user?.countryCode || '',
          profilePicture: doctor.user?.profilePicture || doctor.profilePicture || null,
          role: doctor.user?.role || 'doctor',
          isActive: doctor.user?.isActive !== false,
          gender: doctor.user?.gender || null,
          dateOfBirth: doctor.user?.dateOfBirth || null,
          createdAt: doctor.user?.createdAt || null
        },
        // Specialty Details
        specialty: {
          _id: doctor.specialty?._id?.toString() || null,
          name: doctor.specialty?.name || 'N/A',
          description: doctor.specialty?.description || null
        },
        // Professional Details (Complete Profile Information)
        professionalDetails: {
          licenseNumber: doctor.licenseNumber || '',
          licenseVerified: doctor.licenseVerified || false,
          licenseVerifiedAt: doctor.licenseVerifiedAt || null,
          licenseVerifiedBy: doctor.licenseVerifiedBy || null,
          medicalLicense: doctor.medicalLicense || null,
          experience: doctor.experience || 0,
          status: doctor.status || 'pending',
          rating: doctor.rating || {
            average: 0,
            totalRatings: 0
          },
          bio: doctor.bio || null,
          education: doctor.education || [],
          certifications: doctor.certifications || [],
          languages: doctor.languages || [],
          availability: doctor.availability || {},
          address: doctor.address || {},
          bankAccount: doctor.bankAccount ? {
            accountHolderName: doctor.bankAccount.accountHolderName || null,
            bankName: doctor.bankAccount.bankName || null,
            accountNumber: doctor.bankAccount.accountNumber ? `****${doctor.bankAccount.accountNumber.slice(-4)}` : null,
            fullAccountNumber: doctor.bankAccount.accountNumber || null, // For admin use
            routingNumber: doctor.bankAccount.routingNumber ? `****${doctor.bankAccount.routingNumber.slice(-4)}` : null,
            fullRoutingNumber: doctor.bankAccount.routingNumber || null, // For admin use
            accountType: doctor.bankAccount.accountType || null,
            ifscCode: doctor.bankAccount.ifscCode || null,
            swiftCode: doctor.bankAccount.swiftCode || null,
            verified: doctor.bankAccount.verified || false,
            verifiedAt: doctor.bankAccount.verifiedAt || null,
            verifiedBy: doctor.bankAccount.verifiedBy || null
          } : null,
          createdBy: doctor.createdBy || null
        },
        // Earnings/Payment Details (Image Format)
        // Consultations: Show count or "--" if empty
        consultations: consultationsCount || null,
        consultationsDisplay: consultationsCount > 0 ? consultationsCount.toString() : '--',
        // Fees/Hr: Show formatted fee or "--" if empty
        feesPerHour: doctor.consultationFee || null,
        feesPerHourDisplay: doctor.consultationFee && doctor.consultationFee > 0 
          ? `$${doctor.consultationFee.toFixed(2)}` 
          : '--',
        // Total Earnings: Always show formatted currency
        totalEarnings: totalEarnings || 0,
        totalEarningsDisplay: `$${(totalEarnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        // Additional earnings info for Process Payout action
        availableEarnings: availableEarnings > 0 ? availableEarnings : 0,
        availableEarningsDisplay: `$${(availableEarnings > 0 ? availableEarnings : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        paidOut: paidOutAmount || 0,
        paidOutDisplay: `$${(paidOutAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        pendingPayouts: pendingPayoutAmount || 0,
        pendingPayoutsDisplay: `$${(pendingPayoutAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        // Action flag - can process payout if availableEarnings > 0
        canProcessPayout: availableEarnings > 0,
        // Additional metadata
        createdAt: doctor.createdAt || null,
        updatedAt: doctor.updatedAt || null
      };
    })
  );

  // Sort results
  doctorsWithEarnings.sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle nested sortBy (e.g., 'doctor.fullName', 'specialty.name')
    if (sortBy.includes('.')) {
      const parts = sortBy.split('.');
      aValue = parts.reduce((obj, part) => obj?.[part], a);
      bValue = parts.reduce((obj, part) => obj?.[part], b);
    }
    
    if (sortOrder === 'asc') {
      return (aValue || 0) - (bValue || 0);
    }
    return (bValue || 0) - (aValue || 0);
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

// Get doctor bank account information (for payout processing) - Matches Process Payout Modal
exports.getDoctorBankAccount = async (doctorId) => {
  // Validate doctorId
  if (!doctorId) {
    throw new AppError('Doctor ID is required', 400);
  }

  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new AppError('Invalid doctor ID format', 400);
  }

  const doctor = await Doctor.findById(doctorId)
    .populate({
      path: 'user',
      select: 'firstName lastName email profilePicture'
    })
    .populate({
      path: 'specialty',
      select: 'name'
    })
    .lean();

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  // Get consultations count (IntakeForm with status 'submitted' assigned to this doctor)
  const consultationsCount = await IntakeForm.countDocuments({ 
    doctor: doctorId,
    status: 'submitted'
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

  // Get bank account from doctor profile (primary) or from latest payout (fallback)
  let bankAccountData = null;
  
  // First, try to get from doctor's profile
  if (doctor.bankAccount && doctor.bankAccount.accountNumber) {
    bankAccountData = {
      accountHolder: doctor.bankAccount.accountHolderName || `${doctor.user.firstName} ${doctor.user.lastName}`,
      accountHolderName: doctor.bankAccount.accountHolderName || `${doctor.user.firstName} ${doctor.user.lastName}`,
      bankName: doctor.bankAccount.bankName || '',
      accountNumber: doctor.bankAccount.accountNumber || '',
      maskedAccountNumber: doctor.bankAccount.accountNumber ? `****${doctor.bankAccount.accountNumber.slice(-4)}` : null,
      routingNumber: doctor.bankAccount.routingNumber || '',
      accountType: doctor.bankAccount.accountType || 'checking',
      ifscCode: doctor.bankAccount.ifscCode || null,
      swiftCode: doctor.bankAccount.swiftCode || null,
      verified: doctor.bankAccount.verified || false,
      verifiedAt: doctor.bankAccount.verifiedAt || null,
      verifiedBy: doctor.bankAccount.verifiedBy || null
    };
  } else {
    // Fallback: Get from latest payout if doctor doesn't have bank account in profile
    const latestPayout = await DoctorPayout.findOne({ doctor: doctorId })
      .sort({ createdAt: -1 })
      .lean();

    if (latestPayout && latestPayout.bankAccount) {
      bankAccountData = {
        accountHolder: latestPayout.bankAccount.accountHolder || `${doctor.user.firstName} ${doctor.user.lastName}`,
        accountHolderName: latestPayout.bankAccount.accountHolder || `${doctor.user.firstName} ${doctor.user.lastName}`,
        bankName: latestPayout.bankAccount.bankName || '',
        accountNumber: latestPayout.bankAccount.accountNumber || '',
        maskedAccountNumber: latestPayout.bankAccount.accountNumber ? `****${latestPayout.bankAccount.accountNumber.slice(-4)}` : null,
        routingNumber: latestPayout.bankAccount.routingNumber || '',
        accountType: latestPayout.bankAccount.accountType || 'checking',
        verified: false,
        verifiedAt: null,
        verifiedBy: null
      };
    }
  }

  // Format response to match Process Payout Modal exactly
  return {
    doctor: {
      _id: doctor._id,
      doctorId: doctor._id.toString(),
      name: doctor.user?.firstName && doctor.user?.lastName
        ? `${doctor.user.firstName} ${doctor.user.lastName}`
        : doctor.user?.email || 'Unknown',
      displayName: doctor.user?.firstName && doctor.user?.lastName
        ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`
        : doctor.user?.email || 'Unknown',
      firstName: doctor.user?.firstName || '',
      lastName: doctor.user?.lastName || '',
      email: doctor.user?.email || '',
      profilePicture: doctor.user?.profilePicture || doctor.profilePicture || null
    },
    specialty: {
      _id: doctor.specialty?._id?.toString() || null,
      name: doctor.specialty?.name || 'N/A'
    },
    // Current earnings for payment amount input
    currentEarnings: availableEarnings > 0 ? availableEarnings : 0,
    currentEarningsDisplay: `$${(availableEarnings > 0 ? availableEarnings : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    // Additional earnings info
    totalEarnings: totalEarnings || 0,
    totalEarningsDisplay: `$${(totalEarnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    paidOut: paidOutAmount || 0,
    pendingPayouts: pendingPayoutAmount || 0,
    // Bank account information (matches modal format)
    bankAccount: bankAccountData ? {
      accountHolder: bankAccountData.accountHolder,
      accountHolderName: bankAccountData.accountHolderName,
      bankName: bankAccountData.bankName,
      accountNumber: bankAccountData.accountNumber,
      maskedAccountNumber: bankAccountData.maskedAccountNumber || (bankAccountData.accountNumber ? `****${bankAccountData.accountNumber.slice(-4)}` : null),
      routingNumber: bankAccountData.routingNumber,
      accountType: bankAccountData.accountType,
      ifscCode: bankAccountData.ifscCode,
      swiftCode: bankAccountData.swiftCode,
      verified: bankAccountData.verified || false,
      verifiedAt: bankAccountData.verifiedAt || null,
      verifiedBy: bankAccountData.verifiedBy || null
    } : null
  };
};

// Process payout for a doctor (Admin Panel - Process Payout Modal)
exports.processPayout = async (doctorId, payoutData, processedBy) => {
  // Validate doctorId
  if (!doctorId) {
    throw new AppError('Doctor ID is required', 400);
  }

  const mongoose = require('mongoose');
  if (!mongoose.Types.ObjectId.isValid(doctorId)) {
    throw new AppError('Invalid doctor ID format', 400);
  }

  const doctor = await Doctor.findById(doctorId)
    .populate({
      path: 'user',
      select: 'firstName lastName email profilePicture'
    })
    .populate({
      path: 'specialty',
      select: 'name'
    })
    .lean();

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  // Validate amount
  const { amount } = payoutData;

  if (!amount || amount <= 0) {
    throw new AppError('Invalid payout amount. Amount must be greater than 0', 400);
  }

  // Get available earnings (consultations * consultationFee)
  // Use IntakeForm with status 'submitted' to match earnings summary calculation
  const consultationsCount = await IntakeForm.countDocuments({ 
    doctor: doctorId,
    status: 'submitted'
  });
  
  const totalEarnings = consultationsCount * (doctor.consultationFee || 0);

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
    throw new AppError(`Insufficient earnings. Available: $${availableEarnings.toFixed(2)}, Requested: $${amount.toFixed(2)}`, 400);
  }

  // Get bank account - prioritize from request, then doctor profile, then latest payout
  let bankAccountData = null;

  // 1. Try from request body first
  if (payoutData.bankAccount && 
      payoutData.bankAccount.accountHolder && 
      payoutData.bankAccount.bankName && 
      payoutData.bankAccount.accountNumber && 
      payoutData.bankAccount.routingNumber) {
    bankAccountData = {
      accountHolder: payoutData.bankAccount.accountHolder.trim(),
      bankName: payoutData.bankAccount.bankName.trim(),
      accountNumber: payoutData.bankAccount.accountNumber.trim(),
      routingNumber: payoutData.bankAccount.routingNumber.trim(),
      accountType: payoutData.bankAccount.accountType || 'checking'
    };
  }
  // 2. Try from doctor profile
  else if (doctor.bankAccount && doctor.bankAccount.accountNumber) {
    bankAccountData = {
      accountHolder: doctor.bankAccount.accountHolderName || `${doctor.user.firstName} ${doctor.user.lastName}`,
      bankName: doctor.bankAccount.bankName || '',
      accountNumber: doctor.bankAccount.accountNumber || '',
      routingNumber: doctor.bankAccount.routingNumber || doctor.bankAccount.ifscCode || '',
      accountType: doctor.bankAccount.accountType || 'checking'
    };
  }
  // 3. Try from latest payout as fallback
  else {
    const latestPayout = await DoctorPayout.findOne({ doctor: doctorId })
      .sort({ createdAt: -1 })
      .lean();

    if (latestPayout && latestPayout.bankAccount && latestPayout.bankAccount.accountNumber) {
      bankAccountData = {
        accountHolder: latestPayout.bankAccount.accountHolder || `${doctor.user.firstName} ${doctor.user.lastName}`,
        bankName: latestPayout.bankAccount.bankName || '',
        accountNumber: latestPayout.bankAccount.accountNumber || '',
        routingNumber: latestPayout.bankAccount.routingNumber || '',
        accountType: latestPayout.bankAccount.accountType || 'checking'
      };
    }
  }

  // Validate bank account information
  if (!bankAccountData || !bankAccountData.accountHolder || !bankAccountData.bankName || 
      !bankAccountData.accountNumber || !bankAccountData.routingNumber) {
    throw new AppError('Bank account information is required. Please ensure the doctor has bank account details saved.', 400);
  }

  // Create payout record (status: 'processing' - will be marked as 'completed' when transaction is confirmed)
  const payout = await DoctorPayout.create({
    doctor: doctorId,
    amount: parseFloat(parseFloat(amount).toFixed(2)), // Ensure proper decimal formatting (Number type)
    currency: payoutData.currency || 'USD',
    bankAccount: {
      accountHolder: bankAccountData.accountHolder,
      bankName: bankAccountData.bankName,
      accountNumber: bankAccountData.accountNumber,
      routingNumber: bankAccountData.routingNumber,
      accountType: bankAccountData.accountType
    },
    status: payoutData.autoComplete ? 'completed' : 'processing', // Allow auto-complete option for manual processing
    payoutMethod: payoutData.payoutMethod || 'bank_transfer',
    payoutGateway: payoutData.payoutGateway || 'manual',
    processedBy: processedBy,
    notes: payoutData.notes || null,
    processedAt: payoutData.autoComplete ? new Date() : null,
    transactionId: payoutData.transactionId || null
  });

  logger.info('Payout processed by admin', {
    payoutId: payout.payoutId,
    doctorId,
    amount: payout.amount,
    status: payout.status,
    processedBy
  });

  // Format response with complete details
  const formattedPayout = await DoctorPayout.findById(payout._id)
    .populate({
      path: 'doctor',
      select: 'user specialty consultationFee',
      populate: [
        {
          path: 'user',
          select: 'firstName lastName email profilePicture phoneNumber countryCode'
        },
        {
          path: 'specialty',
          select: 'name'
        }
      ]
    })
    .populate({
      path: 'processedBy',
      select: 'firstName lastName email'
    })
    .lean();

  // Format response to match Process Payout Modal
  return {
    _id: formattedPayout._id,
    payoutId: formattedPayout.payoutId,
    // Doctor Information
    doctor: {
      _id: formattedPayout.doctor._id,
      doctorId: formattedPayout.doctor._id.toString(),
      name: formattedPayout.doctor.user ? `${formattedPayout.doctor.user.firstName || ''} ${formattedPayout.doctor.user.lastName || ''}`.trim() : 'Unknown',
      displayName: formattedPayout.doctor.user ? `Dr. ${formattedPayout.doctor.user.firstName || ''} ${formattedPayout.doctor.user.lastName || ''}`.trim() : 'Unknown',
      firstName: formattedPayout.doctor.user?.firstName || '',
      lastName: formattedPayout.doctor.user?.lastName || '',
      email: formattedPayout.doctor.user?.email || '',
      profilePicture: formattedPayout.doctor.user?.profilePicture || null,
      specialty: formattedPayout.doctor.specialty ? {
        _id: formattedPayout.doctor.specialty._id?.toString() || null,
        name: formattedPayout.doctor.specialty.name || 'N/A'
      } : null,
      consultationFee: formattedPayout.doctor.consultationFee || 0
    },
    // Payout Details
    amount: formattedPayout.amount,
    amountDisplay: `$${formattedPayout.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    currency: formattedPayout.currency || 'USD',
    status: formattedPayout.status,
    statusDisplay: formattedPayout.status.charAt(0).toUpperCase() + formattedPayout.status.slice(1),
    payoutMethod: formattedPayout.payoutMethod || 'bank_transfer',
    payoutGateway: formattedPayout.payoutGateway || 'manual',
    // Bank Account Details (masked for security)
    bankAccount: {
      accountHolder: formattedPayout.bankAccount.accountHolder,
      accountHolderName: formattedPayout.bankAccount.accountHolder,
      bankName: formattedPayout.bankAccount.bankName,
      accountNumber: formattedPayout.bankAccount.accountNumber ? `****${formattedPayout.bankAccount.accountNumber.slice(-4)}` : null,
      fullAccountNumber: formattedPayout.bankAccount.accountNumber || null, // Full number for admin use
      routingNumber: formattedPayout.bankAccount.routingNumber || null,
      maskedRoutingNumber: formattedPayout.bankAccount.routingNumber ? `****${formattedPayout.bankAccount.routingNumber.slice(-4)}` : null,
      fullRoutingNumber: formattedPayout.bankAccount.routingNumber || null, // Full routing for admin use
      accountType: formattedPayout.bankAccount.accountType || 'checking'
    },
    // Transaction Details
    transactionId: formattedPayout.transactionId || null,
    notes: formattedPayout.notes || null,
    failureReason: formattedPayout.failureReason || null,
    // Processed By (Admin who processed)
    processedBy: formattedPayout.processedBy ? {
      _id: formattedPayout.processedBy._id,
      id: formattedPayout.processedBy._id.toString(),
      name: `${formattedPayout.processedBy.firstName || ''} ${formattedPayout.processedBy.lastName || ''}`.trim() || 'Admin',
      firstName: formattedPayout.processedBy.firstName || '',
      lastName: formattedPayout.processedBy.lastName || '',
      email: formattedPayout.processedBy.email || ''
    } : null,
    // Timestamps
    requestedAt: formattedPayout.createdAt,
    requestedAtDisplay: formattedPayout.createdAt ? new Date(formattedPayout.createdAt).toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : null,
    processedAt: formattedPayout.processedAt || null,
    processedAtDisplay: formattedPayout.processedAt ? new Date(formattedPayout.processedAt).toLocaleString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : null,
    failedAt: formattedPayout.failedAt || null,
    createdAt: formattedPayout.createdAt,
    updatedAt: formattedPayout.updatedAt,
    // Earnings Summary (for reference)
    earningsSummary: {
      totalEarnings: totalEarnings || 0,
      totalEarningsDisplay: `$${(totalEarnings || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      paidOut: paidOut || 0,
      paidOutDisplay: `$${(paidOut || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      pendingPayouts: pending || 0,
      pendingPayoutsDisplay: `$${(pending || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      availableEarnings: availableEarnings > 0 ? availableEarnings : 0,
      availableEarningsDisplay: `$${(availableEarnings > 0 ? availableEarnings : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      remainingEarnings: (availableEarnings - amount) > 0 ? (availableEarnings - amount) : 0,
      remainingEarningsDisplay: `$${((availableEarnings - amount) > 0 ? (availableEarnings - amount) : 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
  };
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

