const doctorDashboardService = require('./doctor-dashboard.service');

// Get Dashboard Overview
exports.getDashboardOverview = async (req, res, next) => {
  try {
    const dashboardData = await doctorDashboardService.getDashboardOverview(req.user.id, req.query);
    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: dashboardData
    });
  } catch (err) {
    next(err);
  }
};

// Get Recent Consultations
exports.getRecentConsultations = async (req, res, next) => {
  try {
    const consultations = await doctorDashboardService.getRecentConsultations(req.user.id, req.query);
    res.status(200).json({
      success: true,
      message: 'Recent consultations retrieved successfully',
      data: consultations
    });
  } catch (err) {
    next(err);
  }
};

// Get Today's Schedule
exports.getTodaysSchedule = async (req, res, next) => {
  try {
    const schedule = await doctorDashboardService.getTodaysSchedule(req.user.id, req.query);
    res.status(200).json({
      success: true,
      message: "Today's schedule retrieved successfully",
      data: schedule
    });
  } catch (err) {
    next(err);
  }
};

