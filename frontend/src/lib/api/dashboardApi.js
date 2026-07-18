import apiClient from '../axios';

/**
 * Fetch the dashboard summary for a user.
 */
export async function getDashboardSummary() {
  const response = await apiClient.get('/dashboard/summary');
  return response.data;
}

/**
 * Get the last 7 days of daily stats for the activity chart.
 */
export async function getWeeklyActivity() {
  const response = await apiClient.get('/dashboard/weekly-activity');
  return response.data;
}

/**
 * Fetch upcoming contests (start_time in the future).
 */
export async function getUpcomingContests() {
  const response = await apiClient.get('/dashboard/upcoming-contests');
  return response.data;
}
