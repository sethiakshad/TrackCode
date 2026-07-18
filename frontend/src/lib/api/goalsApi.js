import apiClient from '../axios';

/**
 * Full CRUD for user goals.
 */

export async function getGoals() {
  const response = await apiClient.get('/goals');
  return response.data;
}

export async function createGoal(goalData) {
  // goalData = { goal, target, deadline }
  const response = await apiClient.post('/goals', goalData);
  return response.data;
}

export async function updateGoal(goalId, updates) {
  const response = await apiClient.patch(`/goals/${goalId}`, updates);
  return response.data;
}

export async function deleteGoal(goalId) {
  await apiClient.delete(`/goals/${goalId}`);
  return true;
}

export async function updateGoalProgress(goalId, progress) {
  const response = await apiClient.patch(`/goals/${goalId}/progress`, { progress });
  return response.data;
}
