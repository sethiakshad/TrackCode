const contestService = require('../services/contestService');

const getContestHistory = async (req, res, next) => {
  try {
    const data = await contestService.getContestHistory(req.userId);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getContestStatistics = async (req, res, next) => {
  try {
    const data = await contestService.getContestStatistics(req.userId);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getContestRating = async (req, res, next) => {
  try {
    const data = await contestService.getContestRating(req.userId);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getContestPredictions = async (req, res, next) => {
  try {
    const data = await contestService.getContestPredictions(req.userId);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getContestGraphData = async (req, res, next) => {
  try {
    const data = await contestService.getContestGraphData(req.userId);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getSpeedAnalysis = async (req, res, next) => {
  try {
    const data = await contestService.getSpeedAnalysis(req.userId);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getAccuracyAnalysis = async (req, res, next) => {
  try {
    const data = await contestService.getAccuracyAnalysis(req.userId);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getUpcomingContests = async (req, res, next) => {
  try {
    const data = await contestService.getUpcomingContests(req.userId);
    res.json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getContestHistory,
  getContestStatistics,
  getContestRating,
  getContestPredictions,
  getContestGraphData,
  getSpeedAnalysis,
  getAccuracyAnalysis,
  getUpcomingContests,
};
