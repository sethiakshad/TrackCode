const leetcodeService = require('../services/leetcodeService');

const connectLeetcode = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({
        status: 'error',
        message: 'LeetCode username is required',
      });
    }

    const profile = await leetcodeService.syncLeetcodeData(req.userId, username);
    res.json({
      status: 'success',
      message: 'LeetCode profile connected and synced successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const getLeetcodeProfile = async (req, res, next) => {
  try {
    const profile = await leetcodeService.getLeetcodeProfile(req.userId);
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'LeetCode profile not connected',
      });
    }
    res.json({
      status: 'success',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const getSolvedProblems = async (req, res, next) => {
  try {
    const stats = await leetcodeService.getSolvedProblems(req.userId);
    if (!stats) {
      return res.status(404).json({
        status: 'error',
        message: 'LeetCode profile not connected',
      });
    }
    res.json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const getContestHistory = async (req, res, next) => {
  try {
    const contests = await leetcodeService.getContestHistory(req.userId);
    res.json({
      status: 'success',
      data: contests,
    });
  } catch (error) {
    next(error);
  }
};

const getTopicStatistics = async (req, res, next) => {
  try {
    const stats = await leetcodeService.getTopicStatistics(req.userId);
    res.json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

const syncLeetcode = async (req, res, next) => {
  try {
    const profile = await leetcodeService.getLeetcodeProfile(req.userId);
    if (!profile) {
      return res.status(404).json({
        status: 'error',
        message: 'LeetCode profile not connected',
      });
    }

    const updatedProfile = await leetcodeService.syncLeetcodeData(req.userId, profile.username);
    res.json({
      status: 'success',
      message: 'LeetCode sync completed successfully',
      data: updatedProfile,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  connectLeetcode,
  getLeetcodeProfile,
  getSolvedProblems,
  getContestHistory,
  getTopicStatistics,
  syncLeetcode,
};
