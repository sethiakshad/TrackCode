const prisma = require('../config/prisma');

/**
 * Create a new goal for the user.
 */
const createGoal = async (userId, data) => {
  return prisma.goals.create({
    data: {
      user_id: userId,
      goal: data.goal,
      target: data.target,
      progress: data.progress || 0,
      deadline: data.deadline ? new Date(data.deadline) : null,
      completed: false,
    },
  });
};

/**
 * Update an existing goal.
 */
const updateGoal = async (userId, goalId, data) => {
  // Verify ownership
  const existing = await prisma.goals.findFirst({
    where: { id: goalId, user_id: userId },
  });

  if (!existing) {
    const error = new Error('Goal not found');
    error.statusCode = 404;
    throw error;
  }

  const updatedProgress = data.progress ?? existing.progress;
  const updatedTarget = data.target ?? existing.target;
  const isCompleted = updatedProgress >= updatedTarget;

  return prisma.goals.update({
    where: { id: goalId },
    data: {
      goal: data.goal ?? existing.goal,
      target: updatedTarget,
      progress: updatedProgress,
      deadline: data.deadline ? new Date(data.deadline) : existing.deadline,
      completed: isCompleted,
    },
  });
};

/**
 * Delete a goal by ID.
 */
const deleteGoal = async (userId, goalId) => {
  const existing = await prisma.goals.findFirst({
    where: { id: goalId, user_id: userId },
  });

  if (!existing) {
    const error = new Error('Goal not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.goals.delete({
    where: { id: goalId },
  });
};

/**
 * Get all goals for a user.
 */
const getAllGoals = async (userId) => {
  return prisma.goals.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
};

/**
 * Get daily goals - goals with deadlines set to today.
 */
const getDailyGoals = async (userId) => {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

  return prisma.goals.findMany({
    where: {
      user_id: userId,
      deadline: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: { created_at: 'asc' },
  });
};

/**
 * Get weekly goals - goals with deadlines within the current week.
 */
const getWeeklyGoals = async (userId) => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return prisma.goals.findMany({
    where: {
      user_id: userId,
      deadline: {
        gte: startOfWeek,
        lte: endOfWeek,
      },
    },
    orderBy: { deadline: 'asc' },
  });
};

/**
 * Get progress summary for all goals.
 */
const getProgress = async (userId) => {
  const goals = await prisma.goals.findMany({
    where: { user_id: userId },
  });

  if (goals.length === 0) {
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      overallCompletionPercentage: 0,
    };
  }

  const completed = goals.filter(g => g.completed).length;
  const inProgress = goals.filter(g => !g.completed && g.progress > 0).length;
  const notStarted = goals.filter(g => g.progress === 0 && !g.completed).length;

  const totalProgressPercentage = goals.reduce((sum, g) => {
    return sum + Math.min(100, g.target > 0 ? (g.progress / g.target) * 100 : 0);
  }, 0);

  return {
    total: goals.length,
    completed,
    inProgress,
    notStarted,
    overallCompletionPercentage: parseFloat((totalProgressPercentage / goals.length).toFixed(2)),
  };
};

/**
 * Get completion percentage for a specific goal or all goals.
 */
const getCompletionPercentage = async (userId, goalId) => {
  if (goalId) {
    const goal = await prisma.goals.findFirst({
      where: { id: goalId, user_id: userId },
    });

    if (!goal) {
      const error = new Error('Goal not found');
      error.statusCode = 404;
      throw error;
    }

    return {
      goalId: goal.id,
      goal: goal.goal,
      progress: goal.progress,
      target: goal.target,
      completionPercentage: parseFloat(
        Math.min(100, goal.target > 0 ? (goal.progress / goal.target) * 100 : 0).toFixed(2)
      ),
      completed: goal.completed,
    };
  }

  // Return per-goal percentages for all goals
  const goals = await prisma.goals.findMany({
    where: { user_id: userId },
  });

  return goals.map(g => ({
    goalId: g.id,
    goal: g.goal,
    progress: g.progress,
    target: g.target,
    completionPercentage: parseFloat(
      Math.min(100, g.target > 0 ? (g.progress / g.target) * 100 : 0).toFixed(2)
    ),
    completed: g.completed,
  }));
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
