const prisma = require('../config/prisma');

/**
 * Get dashboard summary metrics.
 */
const getDashboardSummary = async (userId) => {
  let summary = await prisma.dashboard_summary.findUnique({
    where: { user_id: userId },
  });

  if (!summary) {
    // If summary record doesn't exist, create a default one
    summary = await prisma.dashboard_summary.create({
      data: {
        user_id: userId,
        total_solved: 0,
        contest_rating: 0,
        github_score: 0,
        streak: 0,
        weekly_progress: {},
      },
    });
  }
  return summary;
};

/**
 * Get active goals for the user.
 */
const getDailyGoals = async (userId) => {
  return prisma.goals.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
};

/**
 * Get weekly progress stats (aggregated by daily stats over last 7 days).
 */
const getWeeklyProgress = async (userId) => {
  const days = [];
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      dateStr,
      name: dayNames[d.getDay()],
      date: d,
    });
  }

  const startDate = new Date(days[0].date);
  startDate.setHours(0, 0, 0, 0);

  const stats = await prisma.daily_stats.findMany({
    where: {
      user_id: userId,
      date: {
        gte: startDate,
      },
    },
  });

  const statsMap = new Map();
  stats.forEach((s) => {
    const key = new Date(s.date).toISOString().split('T')[0];
    statsMap.set(key, s);
  });

  return days.map((day) => {
    const record = statsMap.get(day.dateStr);
    return {
      name: day.name,
      date: day.dateStr,
      solved: record ? (record.problems_solved || 0) : 0,
      commits: record ? (record.commits || 0) : 0,
    };
  });
};

const getMonthlyProgress = async (userId) => {
  const days = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      dateStr,
      name: `${d.getMonth() + 1}/${d.getDate()}`,
      date: d,
    });
  }

  const startDate = new Date(days[0].date);
  startDate.setHours(0, 0, 0, 0);

  const stats = await prisma.daily_stats.findMany({
    where: {
      user_id: userId,
      date: {
        gte: startDate,
      },
    },
  });

  const statsMap = new Map();
  stats.forEach((s) => {
    const key = new Date(s.date).toISOString().split('T')[0];
    statsMap.set(key, s);
  });

  return days.map((day) => {
    const record = statsMap.get(day.dateStr);
    return {
      name: day.name,
      date: day.dateStr,
      solved: record ? (record.problems_solved || 0) : 0,
      commits: record ? (record.commits || 0) : 0,
    };
  });
};

/**
 * Get coding streak details.
 */
const getCodingStreak = async (userId) => {
  const summary = await getDashboardSummary(userId);
  return {
    streak: summary.streak,
  };
};

/**
 * Get GitHub contribution summary.
 */
const getGithubSummary = async (userId) => {
  return prisma.github_profiles.findUnique({
    where: { user_id: userId },
    include: {
      repositories: {
        take: 5,
        orderBy: { commits: 'desc' },
      },
    },
  });
};

/**
 * Get LeetCode coding stats.
 */
const getLeetcodeSummary = async (userId) => {
  return prisma.leetcode_profiles.findUnique({
    where: { user_id: userId },
  });
};

/**
 * Get Contest history summary.
 */
const getContestSummary = async (userId) => {
  return prisma.contest_history.findMany({
    where: { user_id: userId },
    include: {
      contests: true,
    },
    orderBy: { date: 'desc' },
    take: 5,
  });
};

/**
 * Find topics where user accuracy is lowest.
 */
const getWeakTopics = async (userId) => {
  return prisma.topic_mastery.findMany({
    where: { user_id: userId },
    orderBy: [
      { accuracy: 'asc' },
      { mastery_score: 'asc' },
    ],
    take: 5,
  });
};

/**
 * Get unlocked achievements.
 */
const getAchievements = async (userId) => {
  return prisma.user_achievements.findMany({
    where: { user_id: userId },
    include: {
      achievements: true,
    },
    orderBy: { earned_at: 'desc' },
  });
};

/**
 * Get upcoming platform contests.
 */
const getUpcomingContests = async () => {
  const now = new Date();
  return prisma.contests.findMany({
    where: {
      start_time: {
        gte: now,
      },
    },
    orderBy: { start_time: 'asc' },
    take: 10,
  });
};

module.exports = {
  getDashboardSummary,
  getDailyGoals,
  getWeeklyProgress,
  getMonthlyProgress,
  getCodingStreak,
  getGithubSummary,
  getLeetcodeSummary,
  getContestSummary,
  getWeakTopics,
  getAchievements,
  getUpcomingContests,
};
