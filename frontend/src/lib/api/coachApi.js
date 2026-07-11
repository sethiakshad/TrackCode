import { supabase } from '../../utils/supabase';

/**
 * Get the AI suggestions/recommendations for a user.
 */
export async function getAiRecommendations(userId) {
  const { data, error } = await supabase
    .from('recommendations')
    .select('id, topic, title, difficulty, relevance_reason, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/**
 * Get AI chat feedback / performance analysis summary.
 * We can query custom feedback or return synthesized insights.
 */
export async function getAiFeedbackSummary(userId) {
  const { data, error } = await supabase
    .from('dashboard_summary')
    .select('ai_coach_feedback')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data?.ai_coach_feedback || "You're making great progress! Keep consistency by solving at least 1 medium problem every day.";
}
