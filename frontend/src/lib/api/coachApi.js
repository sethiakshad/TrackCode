import apiClient from '../axios';

/**
 * Get the AI suggestions/recommendations for a user.
 */
export async function getAiRecommendations() {
  const response = await apiClient.get('/ai/recommendations');
  return response.data;
}

/**
 * Get AI chat feedback / performance analysis summary.
 */
export async function getAiFeedbackSummary() {
  const response = await apiClient.get('/ai/summary');
  return response.data?.summary || "You're making great progress! Keep consistency by solving at least 1 medium problem every day.";
}
