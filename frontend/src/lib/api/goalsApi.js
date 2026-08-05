import apiClient from '../axios';

/**
 * Full CRUD for user goals.
 * axios interceptor returns { status, data } — we extract .data
 */

export async function getGoals() {
  const response = await apiClient.get('/goals');
  const arr = response?.data;
  return Array.isArray(arr) ? arr : [];
}

export async function createGoal(goalData) {
  const response = await apiClient.post('/goals', goalData);
  return response?.data ?? response;
}

export async function updateGoal(goalId, updates) {
  const response = await apiClient.patch(`/goals/${goalId}`, updates);
  return response?.data ?? response;
}

export async function deleteGoal(goalId) {
  await apiClient.delete(`/goals/${goalId}`);
  return true;
}

export async function updateGoalProgress(goalId, progress) {
  const response = await apiClient.patch(`/goals/${goalId}/progress`, { progress });
  return response?.data ?? response;
}
