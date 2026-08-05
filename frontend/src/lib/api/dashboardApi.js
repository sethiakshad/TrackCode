import apiClient from '../axios';

// axios interceptor already unwraps response.data → { status, data }
// These helpers extract the inner .data array defensively
const toArray = (res) => (Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []);
const toObject = (res) => (res?.data && typeof res.data === 'object' ? res.data : res ?? {});

/**
 * Fetch the dashboard summary for a user.
 */
export async function getDashboardSummary() {
  const response = await apiClient.get('/dashboard/summary');
  return toObject(response);
}

/**
 * Get the last 7 days of daily stats for the activity chart.
 */
export async function getWeeklyActivity() {
  const response = await apiClient.get('/dashboard/weekly-progress');
  return toArray(response);
}

/**
 * Fetch upcoming contests (start_time in the future).
 */
export async function getUpcomingContests() {
  const response = await apiClient.get('/dashboard/upcoming-contests');
  return toArray(response);
}
