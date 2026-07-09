import { supabase } from '../utils/supabase';

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
  const { error } = await supabase
    .from('codechef_profiles')
    .upsert(
      {
        user_id: userId,
        username: profileData.username,
        rating: profileData.rating,
        stars: profileData.stars,
        global_rank: profileData.global_rank === 'N/A' ? null : parseInt(profileData.global_rank),
        country_rank: profileData.country_rank === 'N/A' ? null : parseInt(profileData.country_rank),
        highest_rating: profileData.highest_rating,
        synced_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
}

/**
 * Fetch the stored CodeChef profile from Supabase.
 */
export async function getCodechefProfile(userId) {
  const { data, error } = await supabase
    .from('codechef_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  
  if (data) {
    // Map DB row to profile shape expected by UI
    return {
      ...data,
      global_rank: data.global_rank || 'N/A',
      country_rank: data.country_rank || 'N/A'
    };
  }
  
  return null;
}

/**
 * Delete the CodeChef profile from Supabase.
 */
export async function disconnectCodechef(userId) {
  const { error } = await supabase
    .from('codechef_profiles')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}
