import { supabase } from '../utils/supabase';

const CF_API_BASE = 'https://codeforces.com/api';

/**
 * Fetch a Codeforces profile from the official API.
 * @param {string} username - Codeforces handle
 * @returns {Promise<object>} Normalized profile data
 */
export async function fetchCodeforcesProfile(username) {
  const trimmed = username.trim();
  if (!trimmed) throw new Error('Username cannot be empty');

  // Fetch user info
  const infoRes = await fetch(`${CF_API_BASE}/user.info?handles=${trimmed}`);
  if (!infoRes.ok) {
    if (infoRes.status === 400) throw new Error(`User "${trimmed}" not found on Codeforces`);
    throw new Error('Failed to fetch Codeforces profile.');
  }

  const infoData = await infoRes.json();
  if (infoData.status !== 'OK' || !infoData.result || infoData.result.length === 0) {
    throw new Error(`User "${trimmed}" not found on Codeforces`);
  }

  const profile = infoData.result[0];

  // Fetch user status (to get problems solved)
  let problemsSolved = 0;
  try {
    const statusRes = await fetch(`${CF_API_BASE}/user.status?handle=${trimmed}`);
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      if (statusData.status === 'OK') {
        // Count unique problems solved
        const solvedSet = new Set();
        statusData.result.forEach((submission) => {
          if (submission.verdict === 'OK' && submission.problem) {
            solvedSet.add(`${submission.problem.contestId}-${submission.problem.index}`);
          }
        });
        problemsSolved = solvedSet.size;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch CF status for problem count', err);
  }

  return {
    username: profile.handle,
    rating: profile.rating || 0,
    max_rating: profile.maxRating || 0,
    rank: profile.rank || 'Unrated',
    max_rank: profile.maxRank || 'Unrated',
    problems_solved: problemsSolved,
    contribution: profile.contribution || 0,
    avatar: profile.titlePhoto || profile.avatar || null,
    organization: profile.organization || '',
    city: profile.city || '',
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
  };
}

/**
 * Save (upsert) a Codeforces profile to Supabase.
 */
export async function saveCodeforcesProfile(userId, profileData) {
  const { error } = await supabase
    .from('codeforces_profiles')
    .upsert(
      {
        user_id: userId,
        username: profileData.username,
        rating: profileData.rating,
        max_rating: profileData.max_rating,
        rank: profileData.rank,
        max_rank: profileData.max_rank,
        problems_solved: profileData.problems_solved,
        synced_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
}

/**
 * Fetch the stored Codeforces profile from Supabase.
 */
export async function getCodeforcesProfile(userId) {
  const { data, error } = await supabase
    .from('codeforces_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
}

/**
 * Delete the Codeforces profile from Supabase.
 */
export async function disconnectCodeforces(userId) {
  const { error } = await supabase
    .from('codeforces_profiles')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}
