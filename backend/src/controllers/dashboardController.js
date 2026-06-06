const dashboardService = require('../services/dashboardService');

const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary(req.query, req.user);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getCategoryBreakdown = async (req, res, next) => {
  try {
    const data = await dashboardService.getCategoryBreakdown(req.query, req.user);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getMonthlyTrends = async (req, res, next) => {
  try {
    const data = await dashboardService.getMonthlyTrends(req.query, req.user);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getRecentActivity = async (req, res, next) => {
  try {
    const limit = req.query.limit || 10;
    const data = await dashboardService.getRecentActivity(limit, req.user);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getWeeklyTrends = async (req, res, next) => {
  try {
    const data = await dashboardService.getWeeklyTrends(req.user);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getInsights = async (req, res, next) => {
  try {
    const data = await dashboardService.getInsights(req.user);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

const getCategoryStackTrends = async (req, res, next) => {
  try {
    const data = await dashboardService.getCategoryStackTrends(req.query, req.user);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSummary,
  getCategoryBreakdown,
  getMonthlyTrends,
  getRecentActivity,
  getWeeklyTrends,
  getCategoryStackTrends,
  getInsights,
};
