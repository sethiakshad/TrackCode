const prisma = require('../config/prisma');
const { fetchLeetCodePreview } = require('./leetcodeService');

/**
 * Topic Mastery: Aggregate topics into 8 primary categories for radar chart.
 * Returns both the aggregated radar data and the full raw topic list.
 */
const getTopicMastery = async (userId) => {
  const topics = await prisma.topic_mastery.findMany({
    where: { user_id: userId },
    orderBy: { solved: 'desc' },
  });

  // Map granular tags → primary categories
  const categoryMap = {
    'Array': 'Arrays',
    'String': 'Strings',
    'Hash Table': 'Hashing',
    'Math': 'Math',
    'Dynamic Programming': 'Dynamic Programming',
    'Sorting': 'Sorting',
    'Greedy': 'Greedy',
    'Depth-First Search': 'Graphs/Trees',
    'Tree': 'Graphs/Trees',
    'Graph': 'Graphs/Trees',
    'Binary Tree': 'Graphs/Trees',
    'Binary Search Tree': 'Graphs/Trees',
    'N-ary Tree': 'Graphs/Trees',
    'Binary Search': 'Binary Search',
    'Two Pointers': 'Two Pointers',
    'Breadth-First Search': 'Graphs/Trees',
    'Stack': 'Stacks/Queues',
    'Queue': 'Stacks/Queues',
    'Monotonic Stack': 'Stacks/Queues',
    'Heap (Priority Queue)': 'Stacks/Queues',
    'Linked List': 'Linked Lists',
    'Sliding Window': 'Sliding Window',
    'Bit Manipulation': 'Bit Manipulation',
    'Recursion': 'Recursion/Backtracking',
    'Backtracking': 'Recursion/Backtracking',
    'Divide and Conquer': 'Recursion/Backtracking',
  };

  const aggregated = {};
  let maxSolved = 0;

  topics.forEach(t => {
    const mainCategory = categoryMap[t.topic] || null;
    if (!mainCategory) return; // Skip unmapped topics for radar
    if (!aggregated[mainCategory]) {
      aggregated[mainCategory] = { topic: mainCategory, solved: 0, count: 0 };
    }
    aggregated[mainCategory].solved += t.solved || 0;
    aggregated[mainCategory].count += 1;
  });

  // Find max solved across categories for normalization
  const categories = Object.values(aggregated).filter(c => c.solved > 0);
  maxSolved = categories.reduce((m, c) => Math.max(m, c.solved), 1);

  // Normalize to 0-100 scale based on relative performance, sort, return top 8
  const radarData = categories
    .map(c => ({
      subject: c.topic,               // "subject" key for Recharts RadarChart
      solved: c.solved,
      value: Math.round((c.solved / maxSolved) * 100),  // "value" key for dataKey
      fullMark: 100,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return radarData;
};

/**
 * Difficulty Distribution: Total counts of solved problems by difficulty.
 * Source: leetcode_profiles table.
 */
const getDifficultyDistribution = async (userId) => {
  const lcProfile = await prisma.leetcode_profiles.findUnique({
    where: { user_id: userId },
  });

  const easy = lcProfile?.easy || 0;
  const medium = lcProfile?.medium || 0;
  const hard = lcProfile?.hard || 0;

  return [
    { name: 'Easy', count: easy, fill: '#10b981' },
    { name: 'Medium', count: medium, fill: '#f59e0b' },
    { name: 'Hard', count: hard, fill: '#ef4444' },
  ];
};

/**
 * Acceptance Rate: Fetched live from LeetCode since it is not stored in the DB.
 * Falls back to UNAVAILABLE (rate: null) if LeetCode cannot be reached.
 */
const getAcceptanceRate = async (userId) => {
  const lcProfile = await prisma.leetcode_profiles.findUnique({
    where: { user_id: userId },
  });

  if (!lcProfile) return { attempted: null, solved: null, rate: null };

  try {
    const liveData = await fetchLeetCodePreview(lcProfile.username);
    const total = liveData.total_submissions || 0;
    const accepted = liveData.ac_submissions || 0;
    const rate = total > 0 ? parseFloat(((accepted / total) * 100).toFixed(2)) : null;
    return {
      attempted: total,
      solved: accepted,
      rate,  // null means UNAVAILABLE, not 0%
    };
  } catch (err) {
    // LeetCode unreachable — return null to signal UNAVAILABLE
    return { attempted: null, solved: null, rate: null };
  }
};

/**
 * Canonical analytics summary: single source of truth for the Analytics page cards.
 * Pulls from leetcode_profiles and dashboard_summary.
 */
const getAnalyticsSummary = async (userId) => {
  const [lcProfile, dashboard] = await Promise.all([
    prisma.leetcode_profiles.findUnique({ where: { user_id: userId } }),
    prisma.dashboard_summary.findUnique({ where: { user_id: userId } }),
  ]);

  // Streak: compute from daily_stats for accuracy
  let currentStreak = 0;
  let longestStreak = 0;

  const allDailyStats = await prisma.daily_stats.findMany({
    where: { user_id: userId, problems_solved: { gt: 0 } },
    orderBy: { date: 'asc' },
    select: { date: true, problems_solved: true },
  });

  if (allDailyStats.length > 0) {
    // Deduplicate and sort dates
    const activeDates = [...new Set(
      allDailyStats.map(s => {
        const d = s.date instanceof Date ? s.date : new Date(s.date);
        // Use UTC date string to avoid timezone shifts
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      })
    )].sort();

    let tempStreak = 1;
    longestStreak = 1;

    for (let i = 1; i < activeDates.length; i++) {
      const prev = new Date(activeDates[i - 1] + 'T00:00:00Z');
      const curr = new Date(activeDates[i] + 'T00:00:00Z');
      const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    // Check if current streak is still active (last active day is today or yesterday)
    const lastActiveDate = new Date(activeDates[activeDates.length - 1] + 'T00:00:00Z');
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const diffFromToday = Math.round((today - lastActiveDate) / (1000 * 60 * 60 * 24));

    if (diffFromToday <= 1) {
      // Rebuild current streak from end
      let streak = 1;
      for (let i = activeDates.length - 2; i >= 0; i--) {
        const prev = new Date(activeDates[i] + 'T00:00:00Z');
        const curr = new Date(activeDates[i + 1] + 'T00:00:00Z');
        const diff = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
        if (diff === 1) {
          streak++;
        } else {
          break;
        }
      }
      currentStreak = streak;
    }
  }

  // Contest count from contest_history
  const contestCount = await prisma.contest_history.count({ where: { user_id: userId } });

  return {
    totalSolved: lcProfile?.problems_solved || 0,
    easy: lcProfile?.easy || 0,
    medium: lcProfile?.medium || 0,
    hard: lcProfile?.hard || 0,
    contestRating: lcProfile?.contest_rating || dashboard?.contest_rating || 0,
    contestsEntered: contestCount,
    currentStreak,
    longestStreak,
    lcUsername: lcProfile?.username || null,
    lastSynced: lcProfile?.synced_at || null,
  };
};

/**
 * Heatmap Data: Problems solved grouped by date (UTC-safe).
 */
const getHeatmapData = async (userId) => {
  const dailyStats = await prisma.daily_stats.findMany({
    where: { user_id: userId },
    select: { date: true, problems_solved: true },
    orderBy: { date: 'asc' },
  });

  return dailyStats
    .filter(stat => (stat.problems_solved || 0) > 0)
    .map(stat => {
      const d = stat.date instanceof Date ? stat.date : new Date(stat.date);
      const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      return { date: dateStr, count: stat.problems_solved };
    });
};

/**
 * Weekly Statistics: Aggregated from daily_stats for last N weeks, including zero days.
 */
const getWeeklyStatistics = async (userId) => {
  // Fetch last 8 weeks of daily stats
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setUTCDate(eightWeeksAgo.getUTCDate() - 56);
  eightWeeksAgo.setUTCHours(0, 0, 0, 0);

  const stats = await prisma.daily_stats.findMany({
    where: {
      user_id: userId,
      date: { gte: eightWeeksAgo },
    },
    orderBy: { date: 'asc' },
  });

  // Group by week (Monday-based)
  const weekMap = new Map();
  stats.forEach(s => {
    const d = s.date instanceof Date ? s.date : new Date(s.date);
    // Get Monday of this week
    const day = d.getUTCDay(); // 0=Sun
    const diff = (day === 0 ? -6 : 1 - day);
    const monday = new Date(d);
    monday.setUTCDate(d.getUTCDate() + diff);
    monday.setUTCHours(0, 0, 0, 0);
    const weekKey = monday.toISOString().split('T')[0];

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, {
        name: `W${monday.getUTCDate()}/${monday.getUTCMonth() + 1}`,
        week_start: weekKey,
        problems_solved: 0,
        commits: 0,
      });
    }
    const w = weekMap.get(weekKey);
    w.problems_solved += (s.problems_solved || 0);
    w.commits += (s.commits || 0);
  });

  return Array.from(weekMap.values())
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
    .slice(-8);
};

const getMonthlyStatistics = async (userId, limit = 12) => {
  const stats = await prisma.daily_stats.findMany({
    where: { user_id: userId },
    orderBy: { date: 'asc' },
  });

  const monthMap = new Map();
  stats.forEach(s => {
    const d = s.date instanceof Date ? s.date : new Date(s.date);
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth() + 1;
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        name: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' }),
        month_start: `${year}-${String(month).padStart(2, '0')}-01`,
        problems_solved: 0,
        commits: 0,
        contests_played: 0,
      });
    }

    const m = monthMap.get(monthKey);
    m.problems_solved += (s.problems_solved || 0);
    m.commits += (s.commits || 0);
    m.contests_played += (s.contests_played || 0);
  });

  return Array.from(monthMap.values())
    .sort((a, b) => a.month_start.localeCompare(b.month_start))
    .slice(-limit);
};

const getCustomStatistics = async (userId, start, end) => {
  const startDate = new Date(start + 'T00:00:00Z');
  const endDate = new Date(end + 'T23:59:59Z');

  const stats = await prisma.daily_stats.findMany({
    where: {
      user_id: userId,
      date: { gte: startDate, lte: endDate },
    },
    orderBy: { date: 'asc' },
  });

  return stats.map(s => {
    const d = s.date instanceof Date ? s.date : new Date(s.date);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return {
      name: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' }),
      date: dateStr,
      solved: s.problems_solved || 0,
      commits: s.commits || 0,
    };
  });
};

/**
 * Radar Chart Data (legacy endpoint — delegates to getTopicMastery).
 */
const getRadarChartData = async (userId) => {
  return getTopicMastery(userId);
};

/**
 * Progress Graph: Cumulative solved problems over time.
 */
const getProgressGraph = async (userId) => {
  const stats = await prisma.daily_stats.findMany({
    where: { user_id: userId },
    orderBy: { date: 'asc' },
    select: { date: true, problems_solved: true },
  });

  let cumulative = 0;
  return stats.map(stat => {
    cumulative += (stat.problems_solved || 0);
    const d = stat.date instanceof Date ? stat.date : new Date(stat.date);
    const dateStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    return { date: dateStr, solved: cumulative };
  });
};

/**
 * Contest Performance: Historic contest records.
 */
const getContestPerformance = async (userId) => {
  return prisma.contest_history.findMany({
    where: { user_id: userId },
    include: { contests: true },
    orderBy: { date: 'asc' },
  });
};

module.exports = {
  getTopicMastery,
  getDifficultyDistribution,
  getAcceptanceRate,
  getAnalyticsSummary,
  getHeatmapData,
  getWeeklyStatistics,
  getMonthlyStatistics,
  getCustomStatistics,
  getRadarChartData,
  getProgressGraph,
  getContestPerformance,
};
