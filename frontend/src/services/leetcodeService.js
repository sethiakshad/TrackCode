import apiClient from '../lib/axios';

const LEETCODE_API_BASE = 'https://alfa-leetcode-api.onrender.com';
const VERIFICATION_RETRY_COUNT = 5;
const VERIFICATION_RETRY_DELAY_MS = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithTimeout = async (url, timeoutMs = 45000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Fetch raw profile payload from LeetCode API (includes bio/website fields).
 * @param {string} username
 */
export async function fetchLeetCodeProfileRaw(username) {
  const trimmed = username.trim();
  if (!trimmed) throw new Error('Username cannot be empty');

  const profileRes = await fetchWithTimeout(
    `${LEETCODE_API_BASE}/${encodeURIComponent(trimmed)}?t=${Date.now()}`
  );

  if (!profileRes.ok) {
    if (profileRes.status === 404) throw new Error(`User "${trimmed}" not found on LeetCode`);
    throw new Error('Failed to fetch LeetCode profile. The API may be warming up — try again in 30s.');
  }

  const profile = await profileRes.json();

  if (profile.errors || profile.error) {
    throw new Error(`User "${trimmed}" not found on LeetCode`);
  }

  return profile;
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
 * Fetch a LeetCode profile from the public API.
 * @param {string} username - LeetCode username
 * @returns {Promise<object>} Normalized profile data
 */
export async function fetchLeetCodeProfile(username) {
  const trimmed = username.trim();
  if (!trimmed) throw new Error('Username cannot be empty');

  const profile = await fetchLeetCodeProfileRaw(trimmed);

  // Fetch contest and solved statistics in parallel
  const [contestRes, solvedRes] = await Promise.all([
    fetchWithTimeout(`${LEETCODE_API_BASE}/${encodeURIComponent(trimmed)}/contest?t=${Date.now()}`),
    fetchWithTimeout(`${LEETCODE_API_BASE}/${encodeURIComponent(trimmed)}/solved?t=${Date.now()}`),
  ]);

  let contestData = {};
  if (contestRes.ok) {
    try {
      contestData = await contestRes.json();
    } catch {
      // contest data is optional
    }
  }

  let solvedData = {};
  if (solvedRes.ok) {
    try {
      solvedData = await solvedRes.json();
    } catch {
      // solved data is optional
    }
  }

  return {
    username: trimmed,
    ranking: profile.ranking || null,
    contest_rating: Math.round(contestData.contestRating || 0) || null,
    problems_solved: solvedData.solvedProblem || profile.totalSolved || 0,
    easy: solvedData.easySolved || profile.easySolved || 0,
    medium: solvedData.mediumSolved || profile.mediumSolved || 0,
    hard: solvedData.hardSolved || profile.hardSolved || 0,
    acceptance_rate: profile.acceptanceRate || null,
    reputation: profile.reputation || 0,
    contribution_points: profile.contributionPoints || 0,
    avatar: profile.avatar || null,
    about: profile.about || '',
    company: profile.company || '',
    school: profile.school || '',
    website: profile.website || [],
  };
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
    return response.data || null;
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
