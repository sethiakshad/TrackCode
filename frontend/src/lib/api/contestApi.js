import { supabase } from '../../utils/supabase';

/**
 * Get contest history for a user with contest details joined.
 */
export async function getContestHistory(userId) {
  const { data, error } = await supabase
    .from('contest_history')
    .select(`
      id,
      rank,
      old_rating,
      new_rating,
      solved,
      penalty,
      date,
      contests (
        id,
        name,
        platform,
        start_time,
        url
      )
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data ?? []).map((h) => ({
    id: h.id,
    name: h.contests?.name ?? 'Unknown Contest',
    platform: h.contests?.platform ?? 'unknown',
    rank: h.rank,
    oldRating: h.old_rating,
    newRating: h.new_rating,
    ratingChange: h.new_rating && h.old_rating ? h.new_rating - h.old_rating : null,
    solved: h.solved,
    date: h.date,
    url: h.contests?.url,
  }));
}

/**
 * Get rating graph data (for line chart).
 */
export async function getRatingHistory(userId) {
  const { data, error } = await supabase
    .from('contest_history')
    .select(`
      new_rating,
      date,
      contests ( name, platform )
    `)
    .eq('user_id', userId)
    .order('date', { ascending: true })
    .limit(30);

  if (error) throw error;

  return (data ?? []).map((h) => ({
    name: h.contests?.name ?? 'Contest',
    rating: h.new_rating ?? 0,
    date: h.date,
  }));
}

/**
 * Get upcoming contests.
 */
export async function getUpcomingContests() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('contests')
    .select('id, name, platform, start_time, duration, url')
    .gte('start_time', now)
    .order('start_time', { ascending: true })
    .limit(10);

  if (error) throw error;
  return data ?? [];
}

/**
 * Get contest predictions for the user.
 */
export async function getContestPredictions(userId) {
  const { data, error } = await supabase
    .from('contest_predictions')
    .select(`
      predicted_rank,
      predicted_rating,
      confidence,
      contests ( name, platform, start_time )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) throw error;
  return data ?? [];
}
