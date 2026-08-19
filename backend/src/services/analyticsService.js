const prisma = require('../config/prisma');

/**
 * Topic Mastery: List of topics, count of solved, accuracy, and mastery score.
 */
const getTopicMastery = async (userId) => {
  return prisma.topic_mastery.findMany({
    where: { user_id: userId },
    orderBy: { mastery_score: 'desc' },
  });
};

/**
 * Difficulty Distribution: Total counts of solved problems by difficulty.
 */
const getDifficultyDistribution = async (userId) => {
  // Aggregate difficulty across all platforms if possible, but mainly LeetCode
  const lcProfile = await prisma.leetcode_profiles.findUnique({
    where: { user_id: userId },
  });

  return [
    { name: 'Easy', count: lcProfile?.easy || 0, fill: '#10b981' },
    { name: 'Medium', count: lcProfile?.medium || 0, fill: '#f59e0b' },
    { name: 'Hard', count: lcProfile?.hard || 0, fill: '#ef4444' },
  ];
};

/**
 * Acceptance Rate: LeetCode no longer easily exposes global acceptance rate via GraphQL.
 * Returning 0 or null cleanly so the frontend doesn't show fake values.
 */
const getAcceptanceRate = async (userId) => {
  return {
    attempted: 0,
    solved: 0,
    rate: 0, // Frontend handles 0 as N/A or gracefully
  };
};

/**
 * Heatmap Data: Problems solved grouped by date.
 */
const getHeatmapData = async (userId) => {
  const dailyStats = await prisma.daily_stats.findMany({
    where: { user_id: userId },
    select: {
      date: true,
      problems_solved: true,
      commits: true,
    },
    orderBy: { date: 'asc' },
  });

  return dailyStats.map(stat => ({
    date: (stat.date instanceof Date ? stat.date : new Date(stat.date)).toISOString().split('T')[0],
    count: stat.problems_solved + stat.commits,
  }));
};

/**
 * Weekly Statistics: Weekly progress aggregation.
 */
const getWeeklyStatistics = async (userId) => {
  return prisma.weekly_stats.findMany({
    where: { user_id: userId },
    orderBy: { week_start: 'desc' },
    take: 12, // Last 12 weeks
  });
};

const getMonthlyStatistics = async (userId, limit = 12) => {
  const stats = await prisma.daily_stats.findMany({
    where: { user_id: userId },
    orderBy: { date: 'asc' },
  });

  const monthMap = new Map();
  stats.forEach(s => {
    const d = s.date instanceof Date ? s.date : new Date(s.date);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        name: d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' }),
        month_start: new Date(d.getFullYear(), d.getMonth(), 1).toISOString(),
        problems_solved: 0,
        commits: 0,
        contests_played: 0,
        xp_earned: 0,
        study_minutes: 0,
      });
    }
    
    const m = monthMap.get(monthKey);
    m.problems_solved += (s.problems_solved || 0);
    m.commits += (s.commits || 0);
    m.contests_played += (s.contests_played || 0);
    m.xp_earned += (s.xp_earned || 0);
    m.study_minutes += (s.study_minutes || 0);
  });

  // Convert map to array and sort by month_start descending, then take limit
  const sorted = Array.from(monthMap.values())
    .sort((a, b) => new Date(b.month_start) - new Date(a.month_start))
    .slice(0, limit);

  // Reverse it back so the chart renders oldest on the left to newest on the right
  return sorted.reverse();
};

const getCustomStatistics = async (userId, start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  // Ensure we include the whole end date
  endDate.setHours(23, 59, 59, 999);

  const stats = await prisma.daily_stats.findMany({
    where: { 
      user_id: userId,
      date: {
        gte: startDate,
        lte: endDate
      }
    },
    orderBy: { date: 'asc' },
  });

  return stats.map(s => ({
    name: (s.date instanceof Date ? s.date : new Date(s.date)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    date: s.date,
    solved: s.problems_solved || 0,
    commits: s.commits || 0,
  }));
};

/**
 * Radar Chart Data: Performance vectors (e.g. Speed, Accuracy, Consistency, LeetCode, GitHub).
 */
const getRadarChartData = async (userId) => {
  const topicMastery = await prisma.topic_mastery.findMany({
    where: { user_id: userId },
    take: 6,
  });

  // Default dimensions if data is insufficient
  const defaultDimensions = [
    { subject: 'Algorithms', value: 70 },
    { subject: 'Data Structures', value: 65 },
    { subject: 'Database', value: 80 },
    { subject: 'System Design', value: 50 },
    { subject: 'JavaScript', value: 85 },
    { subject: 'Python', value: 75 },
  ];

  if (topicMastery.length === 0) {
    return defaultDimensions;
  }

  return topicMastery.map(tm => ({
    subject: tm.topic,
    value: parseFloat(tm.accuracy.toString()),
  }));
};

/**
 * Progress Graph: Chronological progression of total solved problems.
 */
const getProgressGraph = async (userId) => {
  const stats = await prisma.daily_stats.findMany({
    where: { user_id: userId },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      problems_solved: true,
    },
  });

  let cumulativeSolved = 0;
  return stats.map(stat => {
    cumulativeSolved += stat.problems_solved;
    return {
      date: (stat.date instanceof Date ? stat.date : new Date(stat.date)).toISOString().split('T')[0],
      solved: cumulativeSolved,
    };
  });
};

/**
 * Contest Performance: Historic ranks and rating fluctuations.
 */
const getContestPerformance = async (userId) => {
  return prisma.contest_history.findMany({
    where: { user_id: userId },
    include: {
      contests: true,
    },
    orderBy: { date: 'asc' },
  });
};

module.exports = {
  getTopicMastery,
  getDifficultyDistribution,
  getAcceptanceRate,
  getHeatmapData,
  getWeeklyStatistics,
  getMonthlyStatistics,
  getCustomStatistics,
  getRadarChartData,
  getProgressGraph,
  getContestPerformance,
};
