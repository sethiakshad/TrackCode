import apiClient from '../axios';

/**
 * Fetch topic mastery data for the radar chart.
 * Backend returns: { status: 'success', data: [{ subject, solved, value, fullMark }] }
 * Axios interceptor strips outer response, so we get: { status: 'success', data: [...] }
 */
export async function getTopicMastery() {
  const response = await apiClient.get('/analytics/topic-mastery');
  const rows = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
  
  // The backend now returns normalized objects with {subject, solved, value, fullMark}
  // Validate every value to prevent NaN from reaching charts
  return rows.map((t) => ({
    subject: t.subject || t.topic || 'Unknown',
    value: Number.isFinite(t.value) ? t.value : 0,
    solved: Number.isFinite(t.solved) ? t.solved : 0,
    fullMark: 100,
  }));
}

/**
 * Get difficulty distribution from leetcode_profiles.
 * Backend returns: { status: 'success', data: [{ name, count, fill }] }
 */
export async function getDifficultyDistribution() {
  const response = await apiClient.get('/analytics/difficulty-distribution');
  const arr = response?.data;
  return Array.isArray(arr) ? arr : [];
}

/**
 * Get overall stats for the analytics overview cards.
 * Combines acceptance-rate endpoint + analytics summary endpoint.
 */
export async function getAnalyticsOverview() {
  try {
    const [acceptanceRes, summaryRes] = await Promise.all([
      apiClient.get('/analytics/acceptance-rate').catch(() => ({ data: { rate: null } })),
      apiClient.get('/analytics/summary').catch(() => ({ data: null })),
    ]);

    // Axios interceptor returns response.data = { status, data }
    const accData = acceptanceRes?.data ?? {};
    const summaryData = summaryRes?.data ?? {};

    return {
      // Acceptance rate: null means unavailable, 0 means 0%
      acceptanceRate: accData?.rate !== null && accData?.rate !== undefined 
        ? parseFloat(Number(accData.rate).toFixed(1)) 
        : null,
      totalSolved: summaryData?.totalSolved || 0,
      easy: summaryData?.easy || 0,
      medium: summaryData?.medium || 0,
      hard: summaryData?.hard || 0,
      contestRating: summaryData?.contestRating || 0,
      contestsEntered: summaryData?.contestsEntered || 0,
      currentStreak: summaryData?.currentStreak || 0,
      longestStreak: summaryData?.longestStreak || 0,
      lcUsername: summaryData?.lcUsername || null,
      lastSynced: summaryData?.lastSynced || null,
    };
  } catch (err) {
    return { 
      acceptanceRate: null, totalSolved: 0, easy: 0, medium: 0, hard: 0,
      contestRating: 0, contestsEntered: 0, currentStreak: 0, longestStreak: 0,
      lcUsername: null, lastSynced: null,
    };
  }
}

/**
 * Get weekly stats for the analytics page.
 */
export async function getWeeklyStats(limit = 8) {
  const response = await apiClient.get(`/analytics/weekly?limit=${limit}`);
  const arr = response?.data;
  return Array.isArray(arr) ? arr : [];
}

/**
 * Get monthly stats for the analytics page.
 */
export async function getMonthlyStats(limit = 6) {
  const response = await apiClient.get(`/analytics/monthly?limit=${limit}`);
  const arr = response?.data;
  return Array.isArray(arr) ? arr : [];
}

/**
 * Get custom date range stats.
 */
export async function getCustomStats(start, end) {
  const response = await apiClient.get(`/analytics/custom?start=${start}&end=${end}`);
  const arr = response?.data;
  return Array.isArray(arr) ? arr : [];
}

/**
 * Get heatmap data.
 */
export async function getHeatmapData() {
  const response = await apiClient.get('/analytics/heatmap');
  const arr = response?.data;
  return Array.isArray(arr) ? arr : [];
}
