const goalService = require('../services/goalService');

const createGoal = async (req, res, next) => {
  try {
    const { goal, target, progress, deadline } = req.body;
    if (!goal || target === undefined) {
      return res.status(400).json({
        status: 'error',
        message: 'Goal description and target are required',
      });
    }

    const data = await goalService.createGoal(req.userId, { goal, target, progress, deadline });
    res.status(201).json({
      status: 'success',
      message: 'Goal created successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const updateGoal = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    const data = await goalService.updateGoal(req.userId, goalId, req.body);
    res.json({
      status: 'success',
      message: 'Goal updated successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const deleteGoal = async (req, res, next) => {
  try {
    const { goalId } = req.params;
    await goalService.deleteGoal(req.userId, goalId);
    res.json({
      status: 'success',
      message: 'Goal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getAllGoals = async (req, res, next) => {
  try {
    const data = await goalService.getAllGoals(req.userId);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getDailyGoals = async (req, res, next) => {
  try {
    const data = await goalService.getDailyGoals(req.userId);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getWeeklyGoals = async (req, res, next) => {
  try {
    const data = await goalService.getWeeklyGoals(req.userId);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getProgress = async (req, res, next) => {
  try {
    const data = await goalService.getProgress(req.userId);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getCompletionPercentage = async (req, res, next) => {
  try {
    const { goalId } = req.query;
    const data = await goalService.getCompletionPercentage(req.userId, goalId || null);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createGoal,
  updateGoal,
  deleteGoal,
  getAllGoals,
  getDailyGoals,
  getWeeklyGoals,
  getProgress,
  getCompletionPercentage,
};
