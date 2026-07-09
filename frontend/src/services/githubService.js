import { supabase } from '../utils/supabase';

const GITHUB_API_BASE = 'https://api.github.com';
const VERIFICATION_RETRY_COUNT = 5;
const VERIFICATION_RETRY_DELAY_MS = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const githubHeaders = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'TrackCode-App',
};

const fetchWithTimeout = async (url, timeoutMs = 45000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: githubHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Fetch raw profile payload from GitHub API (includes bio/website fields).
 * @param {string} username
 */
export async function fetchGitHubProfileRaw(username) {
  const trimmed = username.trim();
  if (!trimmed) throw new Error('Username cannot be empty');

  const profileRes = await fetchWithTimeout(
    `${GITHUB_API_BASE}/users/${encodeURIComponent(trimmed)}?t=${Date.now()}`
  );

  if (profileRes.status === 404) {
    throw new Error(`User "${trimmed}" not found on GitHub`);
  }
  if (profileRes.status === 403) {
    throw new Error('GitHub API rate limit reached. Please try again in a few minutes.');
  }
  if (!profileRes.ok) {
    throw new Error('Failed to fetch GitHub profile. Please try again.');
  }

  return profileRes.json();
}

const collectVerificationText = (profile) => {
  const chunks = [
    profile.bio,
    profile.blog,
    profile.company,
    profile.location,
    profile.name,
    profile.login,
    profile.twitter_username,
  ];

  return chunks
    .filter(Boolean)
    .map((value) => String(value))
    .join(' ')
    .toLowerCase();
};

/**
 * Check whether a verification code appears on the user's public GitHub profile.
 */
export async function verifyGitHubOwnership(username, verificationCode) {
  const normalizedCode = verificationCode.trim().toLowerCase();
  if (!normalizedCode) {
    throw new Error('Verification code is missing.');
  }

  let lastProfile = null;

  for (let attempt = 1; attempt <= VERIFICATION_RETRY_COUNT; attempt += 1) {
    lastProfile = await fetchGitHubProfileRaw(username);
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

async function fetchRepoStats(username) {
  const res = await fetchWithTimeout(
    `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated&t=${Date.now()}`
  );

  if (!res.ok) return { total_stars: 0 };

  const repos = await res.json();
  if (!Array.isArray(repos)) return { total_stars: 0 };

  const total_stars = repos.reduce((sum, repo) => sum + (repo.stargazers_count || 0), 0);
  return { total_stars };
}

async function fetchContributionsData(username) {
  let total_commits = 0;
  let contribution_streak = 0;

  try {
    const res = await fetchWithTimeout(
      `https://github-contributions-api.deno.dev/${encodeURIComponent(username)}.json`,
      15000
    );
    
    if (res.ok) {
      const data = await res.json();
      total_commits = data.totalContributions || 0;
      
      if (Array.isArray(data.contributions)) {
        // Flatten the weeks array into a single list of days
        const days = data.contributions.flat();
        
        // Find today's date string (e.g. "2023-10-25")
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const todayStr = `${yyyy}-${mm}-${dd}`;
        
        let streak = 0;
        let foundTodayOrYesterday = false;
        
        // Iterate backwards through the days
        for (let i = days.length - 1; i >= 0; i--) {
          const day = days[i];
          
          if (!foundTodayOrYesterday) {
            if (day.date === todayStr) {
              foundTodayOrYesterday = true;
              if (day.contributionCount > 0) {
                streak++;
              }
            } else if (day.date < todayStr) {
              // Missed today entirely in the array? Start from yesterday
              foundTodayOrYesterday = true;
              if (day.contributionCount > 0) streak++;
              else break; // yesterday was 0, so 0 streak
            }
          } else {
            if (day.contributionCount > 0) {
              streak++;
            } else {
              break;
            }
          }
        }
        
        contribution_streak = streak;
      }
      
      return { total_commits, contribution_streak };
    }
  } catch (err) {
    console.warn('Failed to fetch contributions graph:', err);
  }

  // Fallback to events API if deno API fails
  try {
    for (let page = 1; page <= 3; page += 1) {
      const res = await fetchWithTimeout(
        `${GITHUB_API_BASE}/users/${encodeURIComponent(username)}/events/public?per_page=100&page=${page}&t=${Date.now()}`
      );
      if (!res.ok) break;
      const events = await res.json();
      if (!Array.isArray(events) || events.length === 0) break;
      for (const event of events) {
        if (event.type === 'PushEvent') {
          if (Array.isArray(event.payload?.commits)) {
            total_commits += event.payload.commits.length;
          } else if (typeof event.payload?.size === 'number') {
            total_commits += event.payload.size;
          } else {
            total_commits += 1;
          }
        }
      }
      if (events.length < 100) break;
    }
  } catch (err) {
    console.warn('Failed to fetch events fallback:', err);
  }

  return { total_commits, contribution_streak };
}

const mapDbRowToProfile = (row) => ({
  username: row.username,
  github_id: row.github_id,
  avatar: row.avatar,
  followers: row.followers ?? 0,
  following: row.following ?? 0,
  public_repos: row.public_repos ?? 0,
  total_stars: row.total_stars ?? 0,
  total_commits: row.total_commits ?? 0,
  contribution_streak: row.contribution_streak ?? 0,
  bio: row.bio || '',
  blog: row.blog || '',
  company: row.company || '',
});

/**
 * Fetch a GitHub profile from the public API.
 * @param {string} username
 * @returns {Promise<object>} Normalized profile data
 */
export async function fetchGitHubProfile(username) {
  const trimmed = username.trim();
  if (!trimmed) throw new Error('Username cannot be empty');

  const profile = await fetchGitHubProfileRaw(trimmed);

  const [repoStats, contribData] = await Promise.all([
    fetchRepoStats(trimmed),
    fetchContributionsData(trimmed),
  ]);

  return {
    username: profile.login || trimmed,
    github_id: profile.id,
    avatar: profile.avatar_url || null,
    followers: profile.followers || 0,
    following: profile.following || 0,
    public_repos: profile.public_repos || 0,
    total_stars: repoStats.total_stars,
    total_commits: contribData.total_commits,
    contribution_streak: contribData.contribution_streak,
    bio: profile.bio || '',
    blog: profile.blog || '',
    company: profile.company || '',
  };
}

/**
 * Save (upsert) a GitHub profile to Supabase.
 */
export async function saveGitHubProfile(userId, profileData) {
  const { error } = await supabase
    .from('github_profiles')
    .upsert(
      {
        user_id: userId,
        github_id: profileData.github_id,
        username: profileData.username,
        avatar: profileData.avatar,
        followers: profileData.followers,
        following: profileData.following,
        public_repos: profileData.public_repos,
        total_stars: profileData.total_stars,
        total_commits: profileData.total_commits,
        contribution_streak: profileData.contribution_streak,
        synced_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
}

/**
 * Fetch the stored GitHub profile from Supabase.
 */
export async function getGitHubProfile(userId) {
  const { data, error } = await supabase
    .from('github_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data ? mapDbRowToProfile(data) : null;
}

/**
 * Delete the GitHub profile from Supabase.
 */
export async function disconnectGitHub(userId) {
  const { error } = await supabase
    .from('github_profiles')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
}
