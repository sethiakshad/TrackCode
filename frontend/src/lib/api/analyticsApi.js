import apiClient from '../axios';

/**
 * Fetch topic mastery data for the radar chart.
 */
export async function getTopicMastery() {
  const response = await apiClient.get('/analytics/topic-mastery');
  
  // Map to recharts-friendly format (backend might already do this, but just in case)
  return (response.data ?? []).map((t) => ({
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
  return response.data;
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
    
    return {
      acceptanceRate: acceptanceRes.data?.acceptanceRate || 0,
      contestsEntered: dashboardRes.data?.contests_entered || 0,
      totalSolved: dashboardRes.data?.total_solved || 0
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
  return response.data;
}

/**
 * Get monthly stats for the analytics page.
 */
export async function getMonthlyStats(limit = 6) {
  const response = await apiClient.get(`/analytics/monthly?limit=${limit}`);
  return response.data;
}

/**
 * Get heatmap data.
 */
export async function getHeatmapData() {
  const response = await apiClient.get('/analytics/heatmap');
  return response.data?.data || [];
}
