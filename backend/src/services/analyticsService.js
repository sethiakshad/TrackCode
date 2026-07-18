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
  const solvedProblems = await prisma.user_problem_history.findMany({
    where: {
      user_id: userId,
      status: 'solved',
    },
    include: {
      problems: true,
    },
  });

  const distribution = { easy: 0, medium: 0, hard: 0, unknown: 0 };
  solvedProblems.forEach((history) => {
    const diff = (history.problems.difficulty || 'unknown').toLowerCase();
    if (distribution[diff] !== undefined) {
      distribution[diff]++;
    } else {
      distribution.unknown++;
    }
  });

  return distribution;
};

/**
 * Acceptance Rate: Total solved versus total attempted.
 */
const getAcceptanceRate = async (userId) => {
  const totalAttempted = await prisma.user_problem_history.count({
    where: { user_id: userId },
  });
  const totalSolved = await prisma.user_problem_history.count({
    where: { user_id: userId, status: 'solved' },
  });

  return {
    attempted: totalAttempted,
    solved: totalSolved,
    rate: totalAttempted > 0 ? parseFloat(((totalSolved / totalAttempted) * 100).toFixed(2)) : 0,
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
    date: stat.date.toISOString().split('T')[0],
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

/**
 * Monthly Statistics: Monthly progress aggregation.
 */
const getMonthlyStatistics = async (userId) => {
  return prisma.monthly_stats.findMany({
    where: { user_id: userId },
    orderBy: { month_start: 'desc' },
    take: 12, // Last 12 months
  });
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
      date: stat.date.toISOString().split('T')[0],
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
  getRadarChartData,
  getProgressGraph,
  getContestPerformance,
};
