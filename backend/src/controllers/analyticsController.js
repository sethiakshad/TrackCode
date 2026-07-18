const analyticsService = require('../services/analyticsService');

const getTopicMastery = async (req, res, next) => {
  try {
    const data = await analyticsService.getTopicMastery(req.userId);
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

const getDifficultyDistribution = async (req, res, next) => {
  try {
    const data = await analyticsService.getDifficultyDistribution(req.userId);
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

const getAcceptanceRate = async (req, res, next) => {
  try {
    const data = await analyticsService.getAcceptanceRate(req.userId);
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

const getHeatmapData = async (req, res, next) => {
  try {
    const data = await analyticsService.getHeatmapData(req.userId);
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

const getWeeklyStatistics = async (req, res, next) => {
  try {
    const data = await analyticsService.getWeeklyStatistics(req.userId);
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

const getMonthlyStatistics = async (req, res, next) => {
  try {
    const data = await analyticsService.getMonthlyStatistics(req.userId);
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

const getRadarChartData = async (req, res, next) => {
  try {
    const data = await analyticsService.getRadarChartData(req.userId);
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

const getProgressGraph = async (req, res, next) => {
  try {
    const data = await analyticsService.getProgressGraph(req.userId);
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

const getContestPerformance = async (req, res, next) => {
  try {
    const data = await analyticsService.getContestPerformance(req.userId);
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTopicMastery,
  getDifficultyDistribution,
  getAcceptanceRate,
  getHeatmapData,
  getWeeklyStatistics,
  getMonthlyStatistics,
  getRadarChartData,
  getProgressGraph,
  getContestPerformance,
};
