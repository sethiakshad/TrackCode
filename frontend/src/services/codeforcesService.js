import apiClient from '../lib/axios';

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
  const timeline = {};
  
  try {
    const statusRes = await fetch(`${CF_API_BASE}/user.status?handle=${trimmed}`);
    if (statusRes.ok) {
      const statusData = await statusRes.json();
      if (statusData.status === 'OK') {
        // Count unique problems solved
        const solvedSet = new Set();
        
        statusData.result.forEach((submission) => {
          if (submission.verdict === 'OK' && submission.problem) {
            const probId = `${submission.problem.contestId}-${submission.problem.index}`;
            if (!solvedSet.has(probId)) {
              solvedSet.add(probId);
              
              // Add to timeline
              if (submission.creationTimeSeconds) {
                const date = new Date(submission.creationTimeSeconds * 1000);
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                timeline[dateStr] = (timeline[dateStr] || 0) + 1;
              }
            }
          }
        });
        problemsSolved = solvedSet.size;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch CF status for problem count', err);
  }

  // Fetch contest count from user.rating
  let contestsAttended = 0;
  try {
    const ratingRes = await fetch(`${CF_API_BASE}/user.rating?handle=${trimmed}`);
    if (ratingRes.ok) {
      const ratingData = await ratingRes.json();
      if (ratingData.status === 'OK' && Array.isArray(ratingData.result)) {
        contestsAttended = ratingData.result.length;
      }
    }
  } catch (err) {
    console.warn('Failed to fetch CF contest history', err);
  }

  return {
    username: profile.handle,
    rating: profile.rating || 0,
    max_rating: profile.maxRating || 0,
    rank: profile.rank || 'Unrated',
    max_rank: profile.maxRank || 'Unrated',
    problems_solved: problemsSolved,
    contests_attended: contestsAttended,
    contribution: profile.contribution || 0,
    avatar: profile.titlePhoto || profile.avatar || null,
    organization: profile.organization || '',
    city: profile.city || '',
    firstName: profile.firstName || '',
    lastName: profile.lastName || '',
    timeline: timeline,
  };
}

/**
 * Save (upsert) a Codeforces profile to Supabase.
 */
export async function saveCodeforcesProfile(userId, profileData) {
  await apiClient.post('/settings/accounts/codeforces', profileData);
}

/**
 * Fetch the stored Codeforces profile from the database.
 * Mirrors getLeetCodeProfile — reads from DB only, never throws.
 */
export async function getCodeforcesProfile(userId) {
  try {
    const response = await apiClient.get('/codeforces/profile');
    // Axios interceptor returns response.data, so response = { status, data: {...} }
    const data = response?.data || response || null;
    if (!data || !data.username) return null;
    return {
      username: data.username,
      rating: data.contest_rating || data.rating || 0,
      max_rating: data.max_rating || 0,
      rank: data.rank || 'Unrated',
      max_rank: data.max_rank || 'Unrated',
      problems_solved: data.problems_solved || 0,
    };
  } catch (error) {
    // Always return null — never throw so context doesn't break on load
    console.warn('getCodeforcesProfile failed (returning null):', error?.response?.status || error?.message);
    return null;
  }
}

/**
 * Delete the Codeforces profile from Supabase.
 */
export async function disconnectCodeforces(userId) {
  await apiClient.delete('/settings/accounts/codeforces');
}
