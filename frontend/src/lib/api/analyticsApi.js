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
  const response = await apiClient.get('/analytics/overview');
  return response.data;
}

/**
 * Get weekly stats for the analytics page.
 */
export async function getWeeklyStats(limit = 8) {
  const response = await apiClient.get(`/analytics/weekly-stats?limit=${limit}`);
  return response.data;
}

/**
 * Get monthly stats for the analytics page.
 */
export async function getMonthlyStats(limit = 6) {
  const response = await apiClient.get(`/analytics/monthly-stats?limit=${limit}`);
  return response.data;
}
