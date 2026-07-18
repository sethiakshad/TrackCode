import apiClient from '../lib/axios';

/**
 * Fetch a CodeChef profile from a community API wrapper.
 * @param {string} username - CodeChef username
 * @returns {Promise<object>} Normalized profile data
 */
export async function fetchCodechefProfile(username) {
  const trimmed = username.trim();
  if (!trimmed) throw new Error('Username cannot be empty');

  // Since there is no official API, we rely on community wrappers.
  // These can sometimes hit rate limits or go down.
  // We'll try one common one, and if it fails, throw a specific error
  // so the UI can handle it gracefully.
  
  try {
    const res = await fetch(`https://codechef-api.sudeep.dev/${trimmed}`, {
      signal: AbortSignal.timeout(10000)
    });
    
    if (!res.ok) {
      throw new Error(`CodeChef API returned status ${res.status}`);
    }
    
    const data = await res.json();
    
    if (!data.success) {
      throw new Error(`User "${trimmed}" not found or API error`);
    }

    return {
      username: trimmed,
      rating: data.currentRating || 0,
      highest_rating: data.highestRating || 0,
      stars: data.stars || '1★',
      global_rank: data.globalRank || 'N/A',
      country_rank: data.countryRank || 'N/A',
      problems_solved: (data.fullySolved?.count || 0) + (data.partiallySolved?.count || 0),
      about: data.about || '',
      country: data.country || '',
    };
  } catch (err) {
    console.warn('CodeChef API fetch failed:', err);
    // Fallback/Mock data to allow testing the UI when the public wrapper is down
    if (username.toLowerCase() === 'demo' || username.toLowerCase() === 'test') {
      return {
        username: trimmed,
        rating: 1850,
        highest_rating: 1900,
        stars: '4★',
        global_rank: 4500,
        country_rank: 1200,
        problems_solved: 245,
        about: 'TC-DEMO (Fallback Mode)',
        country: 'India'
      };
    }
    
    throw new Error('CodeChef API is currently unavailable. Please try again later.');
  }
}

/**
 * Save (upsert) a CodeChef profile to Supabase.
 */
export async function saveCodechefProfile(userId, profileData) {
  await apiClient.post('/settings/accounts/codechef', profileData);
}

/**
 * Fetch the stored CodeChef profile from Supabase.
 */
export async function getCodechefProfile(userId) {
  const response = await apiClient.get('/settings');
  const cc = response.data?.connectedAccounts?.codechef;
  if (!cc) return null;
  return { username: cc.username };
}

/**
 * Delete the CodeChef profile from Supabase.
 */
export async function disconnectCodechef(userId) {
  await apiClient.delete('/settings/accounts/codechef');
}
