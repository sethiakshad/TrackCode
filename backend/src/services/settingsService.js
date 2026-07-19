const prisma = require('../config/prisma');

/**
 * Retrieve user settings and connected accounts status.
 */
const getSettings = async (userId) => {
  let settings = await prisma.user_settings.findUnique({
    where: { user_id: userId },
  });

  if (!settings) {
    settings = await prisma.user_settings.create({
      data: {
        user_id: userId,
        theme: 'system',
        email_notifications: true,
        profile_visibility: 'public',
        language: 'en',
        timezone: 'UTC',
      },
    });
  }

  // Fetch connected profiles
  const [github, leetcode, codeforces] = await Promise.all([
    prisma.github_profiles.findUnique({ where: { user_id: userId } }),
    prisma.leetcode_profiles.findUnique({ where: { user_id: userId } }),
    prisma.codeforces_profiles.findUnique({ where: { user_id: userId } }),
  ]);

  return {
    settings: {
      theme: settings.theme,
      emailNotifications: settings.email_notifications,
      profileVisibility: settings.profile_visibility,
      language: settings.language,
      timezone: settings.timezone,
      updatedAt: settings.updated_at,
    },
    connectedAccounts: {
      github: github ? { username: github.username, syncedAt: github.synced_at } : null,
      leetcode: leetcode ? { username: leetcode.username, syncedAt: leetcode.synced_at } : null,
      codeforces: codeforces ? { username: codeforces.username, syncedAt: codeforces.synced_at } : null,
    },
  };
};

/**
 * Update general user settings (theme, profile_visibility, email_notifications, language, timezone).
 */
const updateSettings = async (userId, data) => {
  const updateData = {};

  if (data.theme !== undefined) updateData.theme = data.theme;
  if (data.emailNotifications !== undefined) updateData.email_notifications = data.emailNotifications;
  if (data.profileVisibility !== undefined) updateData.profile_visibility = data.profileVisibility;
  if (data.language !== undefined) updateData.language = data.language;
  if (data.timezone !== undefined) updateData.timezone = data.timezone;

  const settings = await prisma.user_settings.upsert({
    where: { user_id: userId },
    update: {
      ...updateData,
      updated_at: new Date(),
    },
    create: {
      user_id: userId,
      theme: data.theme || 'system',
      email_notifications: data.emailNotifications !== undefined ? data.emailNotifications : true,
      profile_visibility: data.profileVisibility || 'public',
      language: data.language || 'en',
      timezone: data.timezone || 'UTC',
    },
  });

  return settings;
};

/**
 * Disconnect a profile (delete connection row).
 */
const disconnectAccount = async (userId, platform) => {
  if (platform === 'github') {
    await prisma.github_profiles.deleteMany({ where: { user_id: userId } });
  } else if (platform === 'leetcode') {
    await prisma.leetcode_profiles.deleteMany({ where: { user_id: userId } });
  } else if (platform === 'codeforces') {
    await prisma.codeforces_profiles.deleteMany({ where: { user_id: userId } });
  } else if (platform === 'codechef') {
    // Codechef profiles table is client-side cached / external wrapper
    return { platform, disconnected: true };
  } else {
    const error = new Error('Invalid platform specified');
    error.statusCode = 400;
    throw error;
  }
  return { platform, disconnected: true };
};

/**
 * Connect a profile (upsert connection row for minor platforms).
 */
const syncCodeforcesSubmissions = async (userId, username) => {
  try {
    const res = await axios.get(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(username)}&from=1&count=100`, {
      timeout: 10000,
    });
    if (res.data && res.data.status === 'OK' && Array.isArray(res.data.result)) {
      const solvedByDate = {};
      const seenProblems = new Set();

      for (const sub of res.data.result) {
        if (sub.verdict === 'OK' && sub.problem && sub.creationTimeSeconds) {
          const probKey = `${sub.problem.contestId}-${sub.problem.index}`;
          if (!seenProblems.has(probKey)) {
            seenProblems.add(probKey);
            const dateStr = new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0];
            solvedByDate[dateStr] = (solvedByDate[dateStr] || 0) + 1;
          }
        }
      }

      for (const [dateStr, count] of Object.entries(solvedByDate)) {
        await prisma.daily_stats.upsert({
          where: {
            user_id_date: {
              user_id: userId,
              date: new Date(dateStr),
            },
          },
          update: {
            problems_solved: { increment: count },
          },
          create: {
            user_id: userId,
            date: new Date(dateStr),
            problems_solved: count,
            commits: 0,
            contests_played: 0,
            xp_earned: count * 10,
            study_minutes: count * 15,
          },
        });
      }
    }
  } catch (err) {
    console.warn('[CODEFORCES SYNC WARN]', err.message);
  }
};

const connectAccount = async (userId, platform, profileData) => {
  if (platform === 'codeforces') {
    const profile = await prisma.codeforces_profiles.upsert({
      where: { user_id: userId },
      update: {
        username: profileData.username,
        rating: profileData.rating,
        max_rating: profileData.max_rating,
        rank: profileData.rank,
        max_rank: profileData.max_rank,
        problems_solved: profileData.problems_solved,
        synced_at: new Date(),
      },
      create: {
        user_id: userId,
        username: profileData.username,
        rating: profileData.rating || 0,
        max_rating: profileData.max_rating || 0,
        rank: profileData.rank || 'Unrated',
        max_rank: profileData.max_rank || 'Unrated',
        problems_solved: profileData.problems_solved || 0,
        synced_at: new Date(),
      }
    });

    await syncCodeforcesSubmissions(userId, profileData.username);
    return profile;
  } else if (platform === 'codechef') {
    const count = parseInt(profileData.problems_solved, 10) || 0;
    if (count > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      await prisma.daily_stats.upsert({
        where: {
          user_id_date: {
            user_id: userId,
            date: new Date(todayStr),
          },
        },
        update: {
          problems_solved: { increment: Math.min(count, 5) },
        },
        create: {
          user_id: userId,
          date: new Date(todayStr),
          problems_solved: Math.min(count, 5),
          commits: 0,
          contests_played: 0,
          xp_earned: count * 10,
          study_minutes: count * 15,
        },
      });
    }
    return { username: profileData.username, platform: 'codechef', syncedAt: new Date() };
  } else {
    const error = new Error('Invalid platform specified or platform requires dedicated service (e.g., github, leetcode)');
    error.statusCode = 400;
    throw error;
  }
};

module.exports = {
  getSettings,
  updateSettings,
  disconnectAccount,
  connectAccount,
};
