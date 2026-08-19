const dashboardService = require('../services/dashboardService');

const getDashboardSummary = async (req, res, next) => {
  try {
    const summary = await dashboardService.getDashboardSummary(req.userId);
    res.json({ status: 'success', data: summary });
  } catch (error) {
    next(error);
  }
};

const getDailyGoals = async (req, res, next) => {
  try {
    const goals = await dashboardService.getDailyGoals(req.userId);
    res.json({ status: 'success', data: goals });
  } catch (error) {
    next(error);
  }
};

const getActivityProgress = async (req, res, next) => {
  try {
    const days = parseInt(req.query.limit, 10) || 7;
    const progress = await dashboardService.getActivityProgress(req.userId, days);
    res.json({ status: 'success', data: progress });
  } catch (error) {
    next(error);
  }
};

const getCodingStreak = async (req, res, next) => {
  try {
    const streakData = await dashboardService.getCodingStreak(req.userId);
    res.json({ status: 'success', data: streakData });
  } catch (error) {
    next(error);
  }
};

const getGithubSummary = async (req, res, next) => {
  try {
    const github = await dashboardService.getGithubSummary(req.userId);
    res.json({ status: 'success', data: github || {} });
  } catch (error) {
    next(error);
  }
};

const getLeetcodeSummary = async (req, res, next) => {
  try {
    const leetcode = await dashboardService.getLeetcodeSummary(req.userId);
    res.json({ status: 'success', data: leetcode || {} });
  } catch (error) {
    next(error);
  }
};

const getContestSummary = async (req, res, next) => {
  try {
    const contests = await dashboardService.getContestSummary(req.userId);
    res.json({ status: 'success', data: contests });
  } catch (error) {
    next(error);
  }
};

const getWeakTopics = async (req, res, next) => {
  try {
    const weakTopics = await dashboardService.getWeakTopics(req.userId);
    res.json({ status: 'success', data: weakTopics });
  } catch (error) {
    next(error);
  }
};

const getAchievements = async (req, res, next) => {
  try {
    const achievements = await dashboardService.getAchievements(req.userId);
    res.json({ status: 'success', data: achievements });
  } catch (error) {
    next(error);
  }
};

const getUpcomingContests = async (req, res, next) => {
  try {
    const contests = await dashboardService.getUpcomingContests();
    res.json({ status: 'success', data: contests });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardSummary,
  getDailyGoals,
  getActivityProgress,
  getCodingStreak,
  getGithubSummary,
  getLeetcodeSummary,
  getContestSummary,
  getWeakTopics,
  getAchievements,
  getUpcomingContests,
};
