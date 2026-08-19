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
 * Get continuous activity progress stats for any number of days.
 */
const getActivityProgress = async (userId, daysCount = 7) => {
  const days = [];
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    // Use UTC parts everywhere — the sync service stores dates as UTC midnight
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getUTCDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayNum}`;
    
    // For large ranges, skip showing day name, just format short date
    const name = daysCount <= 7 ? dayNames[d.getUTCDay()] : `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
    
    days.push({
      dateStr,
      name,
      date: d,
    });
  }

  // startDate = UTC midnight of `daysCount` days ago
  const startDate = new Date(`${days[0].dateStr}T00:00:00.000Z`);

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
    const d = new Date(s.date);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dayNum = String(d.getUTCDate()).padStart(2, '0');
    const key = `${year}-${month}-${dayNum}`;
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
  getActivityProgress,
  getCodingStreak,
  getGithubSummary,
  getLeetcodeSummary,
  getContestSummary,
  getWeakTopics,
  getAchievements,
  getUpcomingContests,
};
