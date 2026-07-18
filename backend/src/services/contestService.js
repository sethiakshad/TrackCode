const prisma = require('../config/prisma');

/**
 * Fetch all contest participation history for a user.
 */
const getContestHistory = async (userId) => {
  return prisma.contest_history.findMany({
    where: { user_id: userId },
    include: { contests: true },
    orderBy: { date: 'desc' },
  });
};

/**
 * Fetch general contest statistics (e.g. average rank, peak rating, solved count).
 */
const getContestStatistics = async (userId) => {
  const history = await prisma.contest_history.findMany({
    where: { user_id: userId },
    orderBy: { date: 'asc' },
  });

  if (history.length === 0) {
    return {
      totalContests: 0,
      averageRank: 0,
      peakRating: 0,
      currentRating: 0,
      totalSolved: 0,
      averagePenalty: 0,
    };
  }

  let totalRank = 0;
  let peakRating = 0;
  let totalSolved = 0;
  let totalPenalty = 0;

  history.forEach((h) => {
    totalRank += h.rank || 0;
    totalSolved += h.solved || 0;
    totalPenalty += h.penalty || 0;
    if (h.new_rating && h.new_rating > peakRating) {
      peakRating = h.new_rating;
    }
  });

  const lastParticipation = history[history.length - 1];
  const currentRating = lastParticipation ? lastParticipation.new_rating || 0 : 0;

  return {
    totalContests: history.length,
    averageRank: parseFloat((totalRank / history.length).toFixed(2)),
    peakRating,
    currentRating,
    totalSolved,
    averagePenalty: parseFloat((totalPenalty / history.length).toFixed(2)),
  };
};

/**
 * Fetch rating history and progression of rating over contests.
 */
const getContestRating = async (userId) => {
  const history = await prisma.contest_history.findMany({
    where: { user_id: userId },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      old_rating: true,
      new_rating: true,
      contests: {
        select: {
          name: true,
          platform: true,
        },
      },
    },
  });

  return history.map(h => ({
    contestName: h.contests.name,
    platform: h.contests.platform,
    date: h.date.toISOString().split('T')[0],
    rating: h.new_rating || 0,
    ratingChange: (h.new_rating || 0) - (h.old_rating || 0),
  }));
};

/**
 * Fetch predicted ranks and ratings for future or registration-open contests.
 */
const getContestPredictions = async (userId) => {
  return prisma.contest_predictions.findMany({
    where: { user_id: userId },
    include: { contests: true },
    orderBy: { created_at: 'desc' },
  });
};

/**
 * Fetch historical data formatted specifically for rating progression graphs.
 */
const getContestGraphData = async (userId) => {
  const ratingData = await getContestRating(userId);
  return {
    ratingTrend: ratingData,
  };
};

/**
 * Speed analysis: metrics about time vs solved problems or penalty values.
 */
const getSpeedAnalysis = async (userId) => {
  const history = await prisma.contest_history.findMany({
    where: { user_id: userId },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      penalty: true,
      solved: true,
      contests: {
        select: {
          name: true,
          duration: true,
        },
      },
    },
  });

  return history.map(h => ({
    contestName: h.contests.name,
    solved: h.solved,
    duration: h.contests.duration || 0,
    timePerProblem: h.solved > 0 ? parseFloat((h.penalty / h.solved).toFixed(2)) : 0,
  }));
};

/**
 * Accuracy analysis: percentage of problem completion per contest.
 */
const getAccuracyAnalysis = async (userId) => {
  const history = await prisma.contest_history.findMany({
    where: { user_id: userId },
    orderBy: { date: 'asc' },
    select: {
      date: true,
      solved: true,
    },
  });

  // Since exact contest problem count isn't in DB, we base it on average solved / attempts.
  // We'll calculate a percentage relative to a default 5-problem contest standard.
  return history.map(h => ({
    date: h.date.toISOString().split('T')[0],
    solvedCount: h.solved,
    accuracyRate: Math.min(100, parseFloat(((h.solved / 5) * 100).toFixed(2))),
  }));
};

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
  getContestHistory,
  getContestStatistics,
  getContestRating,
  getContestPredictions,
  getContestGraphData,
  getSpeedAnalysis,
  getAccuracyAnalysis,
  getUpcomingContests,
};

