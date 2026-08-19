import apiClient from '../lib/axios';

const VERIFICATION_RETRY_COUNT = 5;
const VERIFICATION_RETRY_DELAY_MS = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch raw profile payload from our backend (which calls LeetCode GraphQL).
 * Used by verification flow to check if verification code is in the profile.
 * @param {string} username
 */
export async function fetchLeetCodeProfileRaw(username) {
  const trimmed = username.trim();
  if (!trimmed) throw new Error('Username cannot be empty');

  try {
    const response = await apiClient.get(`/leetcode/preview/${encodeURIComponent(trimmed)}`);
    return response.data?.data || response.data;
  } catch (err) {
    if (err.response?.status === 404) {
      throw new Error(`User "${trimmed}" not found on LeetCode`);
    }
    if (err.response?.status === 429) {
      throw new Error('LeetCode rate limit reached. Please wait a minute and try again.');
    }
    if (err.response?.status === 504) {
      throw new Error('LeetCode API timed out. Please try again in a moment.');
    }
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error('Failed to fetch LeetCode profile. Please check your connection and try again.');
  }
}

const collectVerificationText = (profile) => {
  const chunks = [
    profile.about,
    profile.company,
    profile.school,
    profile.name,
    profile.username,
    profile.gitHub,
    profile.twitter,
    profile.linkedIN,
    profile.country,
    ...(Array.isArray(profile.website) ? profile.website : profile.website ? [profile.website] : []),
    ...(Array.isArray(profile.skillTags) ? profile.skillTags : []),
  ];

  return chunks
    .filter(Boolean)
    .map((value) => String(value))
    .join(' ')
    .toLowerCase();
};

/**
 * Check whether a verification code appears on the user's public LeetCode profile.
 * Retries a few times because LeetCode/API updates can lag after profile edits.
 */
export async function verifyLeetCodeOwnership(username, verificationCode) {
  const normalizedCode = verificationCode.trim().toLowerCase();
  if (!normalizedCode) {
    throw new Error('Verification code is missing.');
  }

  let lastProfile = null;

  for (let attempt = 1; attempt <= VERIFICATION_RETRY_COUNT; attempt += 1) {
    lastProfile = await fetchLeetCodeProfileRaw(username);
    const haystack = collectVerificationText(lastProfile);

    if (haystack.includes(normalizedCode)) {
      return { verified: true, profile: lastProfile, attempt };
    }

    if (attempt < VERIFICATION_RETRY_COUNT) {
      await sleep(VERIFICATION_RETRY_DELAY_MS);
    }
  }

  return { verified: false, profile: lastProfile, attempt: VERIFICATION_RETRY_COUNT };
}

/**
 * Fetch a LeetCode profile preview from our backend.
 * This calls our backend's /leetcode/preview/:username endpoint,
 * which in turn calls LeetCode's official GraphQL API.
 * @param {string} username - LeetCode username
 * @returns {Promise<object>} Normalized profile data
 */
export async function fetchLeetCodeProfile(username) {
  const trimmed = username.trim();
  if (!trimmed) throw new Error('Username cannot be empty');

  try {
    const response = await apiClient.get(`/leetcode/preview/${encodeURIComponent(trimmed)}`);
    const data = response.data?.data || response.data;

    return {
      username: data.username || trimmed,
      ranking: data.ranking || null,
      contest_rating: data.contest_rating || null,
      problems_solved: data.problems_solved || 0,
      easy: data.easy || 0,
      medium: data.medium || 0,
      hard: data.hard || 0,
      acceptance_rate: data.acceptance_rate || null,
      reputation: data.reputation || 0,
      contribution_points: data.contribution_points || 0,
      avatar: data.avatar || null,
      about: data.about || '',
      company: data.company || '',
      school: data.school || '',
      website: data.website || [],
    };
  } catch (err) {
    if (err.response?.status === 404) {
      throw new Error(`User "${trimmed}" not found on LeetCode`);
    }
    if (err.response?.status === 429) {
      throw new Error('LeetCode rate limit reached. Please wait a minute and try again.');
    }
    if (err.response?.status === 504) {
      throw new Error('LeetCode API timed out. Please try again in a moment.');
    }
    if (err.response?.data?.message) {
      throw new Error(err.response.data.message);
    }
    throw new Error('Failed to fetch LeetCode profile. Please check your connection and try again.');
  }
}

/**
 * Save (upsert) a LeetCode profile to Supabase.
 * @param {string} userId - The authenticated user's UUID
 * @param {object} profileData - Normalized profile data from fetchLeetCodeProfile
 */
export async function saveLeetCodeProfile(userId, profileData) {
  await apiClient.post('/leetcode/connect', profileData);
}

/**
 * Fetch the stored LeetCode profile from Supabase.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function getLeetCodeProfile(userId) {
  try {
    const response = await apiClient.get('/leetcode/profile');
    return response.data?.data || response.data || null;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

/**
 * Delete the LeetCode profile from Supabase.
 * @param {string} userId
 */
export async function disconnectLeetCode(userId) {
  await apiClient.delete('/settings/accounts/leetcode');
}

/**
 * Trigger backend synchronization for connected LeetCode profile.
 */
export async function syncLeetCodeData() {
  const response = await apiClient.post('/leetcode/sync');
  return response.data?.data || response.data;
}
