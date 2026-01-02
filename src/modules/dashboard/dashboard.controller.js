const dashboardService = require('./dashboard.service');

// Get Dashboard Data
exports.getDashboardData = async (req, res, next) => {
  try {
    const dashboardData = await dashboardService.getDashboardData(req.query);
    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (err) {
    next(err);
  }
};

// Get Revenue vs Payouts Chart
exports.getRevenueVsPayoutsChart = async (req, res, next) => {
  try {
    const chartData = await dashboardService.getRevenueVsPayoutsChart(req.query);
    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (err) {
    next(err);
  }
};

// Get AI Insights
exports.getAIInsights = async (req, res, next) => {
  try {
    const insights = await dashboardService.getAIInsights();
    res.status(200).json({
      success: true,
      data: insights
    });
  } catch (err) {
    next(err);
  }
};

// Get Recent Activity
exports.getRecentActivity = async (req, res, next) => {
  try {
    const activity = await dashboardService.getRecentActivity(req.query);
    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (err) {
    next(err);
  }
};

// Get Prescriptions By Region
exports.getPrescriptionsByRegion = async (req, res, next) => {
  try {
    const regionData = await dashboardService.getPrescriptionsByRegion(req.query);
    res.status(200).json({
      success: true,
      data: regionData
    });
  } catch (err) {
    next(err);
  }
};

