const prisma = require('../config/prisma');
const axios = require('axios');

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
      const topicCounts = {};

      for (const sub of res.data.result) {
        if (sub.verdict === 'OK' && sub.problem && sub.creationTimeSeconds) {
          const probKey = `${sub.problem.contestId}-${sub.problem.index}`;
          if (!seenProblems.has(probKey)) {
            seenProblems.add(probKey);
            const dateStr = new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0];
            solvedByDate[dateStr] = (solvedByDate[dateStr] || 0) + 1;
            
            // Collect tags for topic mastery
            if (sub.problem.tags && Array.isArray(sub.problem.tags)) {
              sub.problem.tags.forEach(tag => {
                // capitalize first letter of each word to match some Leetcode format
                const formattedTag = tag.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                topicCounts[formattedTag] = (topicCounts[formattedTag] || 0) + 1;
              });
            }
          }
        }
      }



      // Upsert topic mastery
      for (const [topic, count] of Object.entries(topicCounts)) {
        await prisma.topic_mastery.upsert({
          where: {
            user_id_topic: {
              user_id: userId,
              topic: topic,
            },
          },
          update: {
            solved: { increment: count },
          },
          create: {
            user_id: userId,
            topic: topic,
            solved: count,
          },
        });
      }
      // Sync Codeforces rating history (Contests)
      const ratingRes = await axios.get(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(username)}`, {
        timeout: 10000,
      });

      if (ratingRes.data && ratingRes.data.status === 'OK' && Array.isArray(ratingRes.data.result)) {
        for (const h of ratingRes.data.result) {
          let contest = await prisma.contests.findFirst({ where: { name: h.contestName } });
          if (!contest) {
            contest = await prisma.contests.create({
              data: {
                name: h.contestName,
                platform: 'codeforces',
                start_time: new Date(h.ratingUpdateTimeSeconds * 1000),
                duration: 7200,
              }
            });
          }

          await prisma.contest_history.upsert({
            where: {
               contest_id_user_id: { contest_id: contest.id, user_id: userId }
            },
            update: {
               old_rating: h.oldRating,
               new_rating: h.newRating,
               rank: h.rank,
               date: new Date(h.ratingUpdateTimeSeconds * 1000)
            },
            create: {
               contest_id: contest.id,
               user_id: userId,
               old_rating: h.oldRating,
               new_rating: h.newRating,
               rank: h.rank,
               date: new Date(h.ratingUpdateTimeSeconds * 1000),
               solved: 0,
               penalty: 0
            }
          });
        }
      }
      
      // Save CF timeline to dashboard_summary for frontend graph merging
      const existing = await prisma.dashboard_summary.findUnique({ where: { user_id: userId } });
      const existingProgress = (existing?.weekly_progress && typeof existing.weekly_progress === 'object')
        ? existing.weekly_progress : {};
      await prisma.dashboard_summary.upsert({
        where: { user_id: userId },
        update: { weekly_progress: { ...existingProgress, cf_timeline: solvedByDate } },
        create: { user_id: userId, weekly_progress: { cf_timeline: solvedByDate }, streak: 0 }
      });

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
        contest_rating: profileData.rating,
        max_rating: profileData.max_rating,
        ranking: profileData.rating, // Codeforces 'rank' is a string ("newbie"), schema 'ranking' is Int. Let's store rating or 0. Wait, schema has ranking Int.
        problems_solved: profileData.problems_solved,
        synced_at: new Date(),
      },
      create: {
        user_id: userId,
        username: profileData.username,
        contest_rating: profileData.rating || 0,
        max_rating: profileData.max_rating || 0,
        ranking: profileData.rating || 0,
        problems_solved: profileData.problems_solved || 0,
        synced_at: new Date(),
      }
    });

    await syncCodeforcesSubmissions(userId, profileData.username);

    // Store CF contests_attended in dashboard_summary weekly_progress
    const cfContests = parseInt(profileData.contests_attended, 10) || 0;
    if (cfContests > 0) {
      const existing = await prisma.dashboard_summary.findUnique({ where: { user_id: userId } });
      const existingProgress = (existing?.weekly_progress && typeof existing.weekly_progress === 'object')
        ? existing.weekly_progress : {};
      await prisma.dashboard_summary.upsert({
        where: { user_id: userId },
        update: { weekly_progress: { ...existingProgress, cf_contests_attended: cfContests }, updated_at: new Date() },
        create: { user_id: userId, weekly_progress: { cf_contests_attended: cfContests }, streak: 0, updated_at: new Date() },
      });
    }

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

const syncLeetCodeContestHistory = async (userId, username) => {
  try {
    const query = `
      query userContestRankingHistory($username: String!) {
        userContestRankingHistory(username: $username) {
          attended
          rating
          ranking
          contest {
            title
            startTime
          }
        }
      }
    `;
    const response = await axios.post('https://leetcode.com/graphql', { query, variables: { username } });
    if (!response.data.data || !response.data.data.userContestRankingHistory) return;
    
    const history = response.data.data.userContestRankingHistory.filter(x => x.attended);
    let oldRating = 1500;
    
    for (const h of history) {
      const externalId = 'LC-' + h.contest.title;
      let contest = await prisma.contests.findFirst({ where: { name: h.contest.title } });
      if (!contest) {
         contest = await prisma.contests.create({
           data: {
             name: h.contest.title,
             platform: 'leetcode',
             start_time: new Date(h.contest.startTime * 1000),
             duration: 5400,
           }
         });
      }

      await prisma.contest_history.upsert({
        where: {
           contest_id_user_id: { contest_id: contest.id, user_id: userId }
        },
        update: {
           old_rating: oldRating,
           new_rating: Math.round(h.rating),
           rank: h.ranking,
           date: new Date(h.contest.startTime * 1000)
        },
        create: {
           contest_id: contest.id,
           user_id: userId,
           old_rating: oldRating,
           new_rating: Math.round(h.rating),
           rank: h.ranking,
           date: new Date(h.contest.startTime * 1000),
           solved: 0,
           penalty: 0
        }
      });
      oldRating = Math.round(h.rating);
    }
  } catch (err) {
    console.error('[LeetCode Contest Sync]', err.message);
  }
};

const syncAllData = async (userId) => {
  const { connectedAccounts } = await getSettings(userId);
  const promises = [];
  
  if (connectedAccounts.leetcode) {
    const leetcodeService = require('./leetcodeService');
    promises.push(leetcodeService.syncLeetcodeData(userId));
    promises.push(syncLeetCodeContestHistory(userId, connectedAccounts.leetcode.username));
  }
  
  if (connectedAccounts.codeforces) {
    promises.push(syncCodeforcesSubmissions(userId, connectedAccounts.codeforces.username));
  }
  
  if (connectedAccounts.github) {
    const githubService = require('./githubService');
    promises.push(githubService.syncUserRepositories(userId));
  }

  const results = await Promise.allSettled(promises);
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.error('Some sync operations failed:', failed.map(f => f.reason));
  }

  return { syncedAt: new Date(), status: 'success' };
};

module.exports = {
  getSettings,
  updateSettings,
  disconnectAccount,
  connectAccount,
  syncAllData,
  syncCodeforcesSubmissions,
};
