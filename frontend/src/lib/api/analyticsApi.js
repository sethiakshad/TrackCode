import { supabase } from '../../utils/supabase';

/**
 * Fetch topic mastery data for the radar chart.
 */
export async function getTopicMastery(userId) {
  const { data, error } = await supabase
    .from('topic_mastery')
    .select('topic, solved, accuracy, mastery_score')
    .eq('user_id', userId)
    .order('mastery_score', { ascending: false });

  if (error) throw error;

  // Map to recharts-friendly format
  return (data ?? []).map((t) => ({
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
export async function getDifficultyDistribution(userId) {
  const { data, error } = await supabase
    .from('leetcode_profiles')
    .select('easy, medium, hard')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;

  if (!data) return [];

  return [
    { name: 'Easy', count: data.easy ?? 0, fill: '#10b981' },
    { name: 'Medium', count: data.medium ?? 0, fill: '#f59e0b' },
    { name: 'Hard', count: data.hard ?? 0, fill: '#ef4444' },
  ];
}

/**
 * Get overall stats for the analytics overview cards.
 */
export async function getAnalyticsOverview(userId) {
  // Acceptance rate: solved / (solved + attempted) from user_problem_history
  const { data: histData, error: histError } = await supabase
    .from('user_problem_history')
    .select('status, attempts')
    .eq('user_id', userId);

  if (histError) throw histError;

  const solved = histData?.filter((h) => h.status === 'solved').length ?? 0;
  const total = histData?.length ?? 0;
  const acceptanceRate = total > 0 ? ((solved / total) * 100).toFixed(1) : '0.0';

  // Contest count
  const { count: contestCount, error: contestError } = await supabase
    .from('contest_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (contestError) throw contestError;

  return {
    acceptanceRate: parseFloat(acceptanceRate),
    contestsEntered: contestCount ?? 0,
    totalSolved: solved,
  };
}

/**
 * Get weekly stats for the analytics page.
 */
export async function getWeeklyStats(userId, limit = 8) {
  const { data, error } = await supabase
    .from('weekly_stats')
    .select('week_start, problems_solved, commits, xp_earned, study_minutes')
    .eq('user_id', userId)
    .order('week_start', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).reverse();
}

/**
 * Get monthly stats for the analytics page.
 */
export async function getMonthlyStats(userId, limit = 6) {
  const { data, error } = await supabase
    .from('monthly_stats')
    .select('month_start, problems_solved, commits, xp_earned, study_minutes')
    .eq('user_id', userId)
    .order('month_start', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).reverse();
}
