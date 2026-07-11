import { supabase } from '../../utils/supabase';

/**
 * Fetch the dashboard summary for a user.
 * Reads from dashboard_summary, leetcode_profiles, github_profiles, and codeforces_profiles.
 */
export async function getDashboardSummary(userId) {
  const { data, error } = await supabase
    .from('dashboard_summary')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

/**
 * Get the last 7 days of daily stats for the activity chart.
 */
export async function getWeeklyActivity(userId) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  const fromDate = sevenDaysAgo.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_stats')
    .select('date, problems_solved, commits, study_minutes')
    .eq('user_id', userId)
    .gte('date', fromDate)
    .order('date', { ascending: true });

  if (error) throw error;

  // Build a complete 7-day array even if some days have no data
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const found = data?.find((r) => r.date === dateStr);
    result.push({
      name: dayNames[d.getDay()],
      date: dateStr,
      solved: found?.problems_solved ?? 0,
      hours: found?.study_minutes ? parseFloat((found.study_minutes / 60).toFixed(1)) : 0,
    });
  }
  return result;
}

/**
 * Fetch upcoming contests (start_time in the future).
 */
export async function getUpcomingContests() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('contests')
    .select('id, name, platform, start_time, duration, url')
    .gte('start_time', now)
    .order('start_time', { ascending: true })
    .limit(5);

  if (error) throw error;
  return data ?? [];
}
