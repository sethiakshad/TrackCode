import apiClient from '../axios';

/**
 * Get contest history for a user with contest details joined.
 */
export async function getContestHistory() {
  const response = await apiClient.get('/contest/history');
  return response.data;
}

/**
 * Get rating graph data (for line chart).
 */
export async function getRatingHistory() {
  const response = await apiClient.get('/contest/graph');
  return response.data;
}

/**
 * Get upcoming contests.
 */
export async function getUpcomingContests() {
  const response = await apiClient.get('/contest/upcoming');
  return response.data;
}

/**
 * Get contest predictions for the user.
 */
export async function getContestPredictions() {
  const response = await apiClient.get('/contest/predictions');
  return response.data;
}
