import apiClient from '../axios';

/**
 * Fetch topic mastery data for the radar chart.
 */
export async function getTopicMastery() {
  const response = await apiClient.get('/analytics/topic-mastery');
  const rows = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
  return rows.map((t) => ({
    subject: t.topic,
    A: Math.round(t.mastery_score),
    solved: t.solved,
    accuracy: t.accuracy,
    fullMark: 100,
  }));
}

/**
 * Get difficulty distribution from leetcode_profiles.
 */
export async function getDifficultyDistribution() {
  const response = await apiClient.get('/analytics/difficulty-distribution');
  const arr = response?.data;
  return Array.isArray(arr) ? arr : [];
}

/**
 * Get overall stats for the analytics overview cards.
 */
export async function getAnalyticsOverview() {
  try {
    const [acceptanceRes, dashboardRes] = await Promise.all([
      apiClient.get('/analytics/acceptance-rate').catch(() => ({ data: { acceptanceRate: 0 } })),
      apiClient.get('/dashboard/summary').catch(() => ({ data: { total_solved: 0, contests_entered: 0 } }))
    ]);

    // acceptanceRes and dashboardRes are already {status, data} from interceptor
    const accData = acceptanceRes?.data ?? acceptanceRes ?? {};
    const dashData = dashboardRes?.data ?? dashboardRes ?? {};

    return {
      acceptanceRate: accData?.acceptanceRate || accData?.rate || 0,
      contestsEntered: dashData?.contests_entered || 0,
      totalSolved: dashData?.total_solved || 0
    };
  } catch (err) {
    return { acceptanceRate: 0, contestsEntered: 0, totalSolved: 0 };
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
  // response is {status, data:[...]} — interceptor already unwrapped axios response
  const arr = response?.data;
  return Array.isArray(arr) ? arr : [];
}
