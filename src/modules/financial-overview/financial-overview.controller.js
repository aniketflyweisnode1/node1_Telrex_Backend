const financialOverviewService = require('./financial-overview.service');

// Get financial overview summary
exports.getFinancialOverview = async (req, res, next) => {
  try {
    const period = req.query.period || 'last_30_days';
    const overview = await financialOverviewService.getFinancialOverview(period);
    res.status(200).json({
      success: true,
      data: overview
    });
  } catch (err) {
    next(err);
  }
};

// Get revenue chart data
exports.getRevenueChart = async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : null;
    const chartData = await financialOverviewService.getRevenueChart(year);
    res.status(200).json({
      success: true,
      data: chartData
    });
  } catch (err) {
    next(err);
  }
};

// Get recent transactions
exports.getRecentTransactions = async (req, res, next) => {
  try {
    const result = await financialOverviewService.getRecentTransactions(req.query);
    res.status(200).json({
      success: true,
      data: result.transactions,
      counts: result.counts,
      pagination: result.pagination
    });
  } catch (err) {
    next(err);
  }
};

