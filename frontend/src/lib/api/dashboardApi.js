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
 * Get activity chart stats for a given number of days.
 */
export async function getActivityProgress(days = 7) {
  const response = await apiClient.get(`/dashboard/activity?limit=${days}`);
  return toArray(response);
}

/**
 * Fetch upcoming contests (start_time in the future).
 */
export async function getUpcomingContests() {
  const response = await apiClient.get('/dashboard/upcoming-contests');
  return toArray(response);
}
