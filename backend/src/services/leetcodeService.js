const axios = require('axios');
const prisma = require('../config/prisma');

/**
 * Service to sync and query LeetCode profile and platform stats.
 * Uses a public unofficial LeetCode GraphQL API endpoint (or similar public API mirror/scraper).
 */

const LEETCODE_API_URL = 'https://leetcode-api-faisalshohag.vercel.app'; // Reliable public JSON proxy for LeetCode stats

/**
 * Syncs LeetCode profile, solved counts, rating, submissions, topics and streaks.
 */
const syncLeetcodeData = async (userId, username) => {
  try {
    // 1. Fetch LeetCode details from public API
    const response = await axios.get(`${LEETCODE_API_URL}/${username}`);
    const data = response.data;

    if (!data || data.errors) {
      throw new Error('Could not fetch LeetCode data for username');
    }

    // 2. Update LeetCode profile info
    const profile = await prisma.leetcode_profiles.upsert({
      where: { user_id: userId },
      update: {
        username,
        ranking: data.ranking || 0,
        problems_solved: data.totalSolved || 0,
        easy: data.easySolved || 0,
        medium: data.mediumSolved || 0,
        hard: data.hardSolved || 0,
        synced_at: new Date(),
      },
      create: {
        user_id: userId,
        username,
        ranking: data.ranking || 0,
        problems_solved: data.totalSolved || 0,
        easy: data.easySolved || 0,
        medium: data.mediumSolved || 0,
        hard: data.hardSolved || 0,
        synced_at: new Date(),
      },
    });

    // 3. Sync topic stats / mastery based on solved tags
    if (data.matchedUser && data.matchedUser.tagProblemCounts) {
      const tagStats = data.matchedUser.tagProblemCounts;
      const allTags = [...tagStats.advanced, ...tagStats.intermediate, ...tagStats.fundamental];
      
      for (const tag of allTags) {
        await prisma.topic_mastery.upsert({
          where: {
            user_id_topic: {
              user_id: userId,
              topic: tag.tagName,
            },
          },
          update: {
            solved: tag.problemsSolved,
            accuracy: 90.00, // Approximate/default accuracy score
            mastery_score: tag.problemsSolved * 10,
            updated_at: new Date(),
          },
          create: {
            user_id: userId,
            topic: tag.tagName,
            solved: tag.problemsSolved,
            accuracy: 90.00,
            mastery_score: tag.problemsSolved * 10,
            updated_at: new Date(),
          },
        });
      }
    }

    // 4. Parse submissionCalendar and upsert into daily_stats for accurate daily activity
    if (data && data.submissionCalendar) {
      let calendar = data.submissionCalendar;
      if (typeof calendar === 'string') {
        try { calendar = JSON.parse(calendar); } catch (e) {}
      }
      if (typeof calendar === 'object' && calendar !== null) {
        for (const [timestampStr, count] of Object.entries(calendar)) {
          const ts = parseInt(timestampStr, 10);
          if (!isNaN(ts)) {
            const d = new Date(ts * 1000);
            const dateStr = d.toISOString().split('T')[0];
            const numCount = parseInt(count, 10) || 0;
            
            await prisma.daily_stats.upsert({
              where: {
                user_id_date: {
                  user_id: userId,
                  date: new Date(dateStr),
                },
              },
              update: {
                problems_solved: numCount,
              },
              create: {
                user_id: userId,
                date: new Date(dateStr),
                problems_solved: numCount,
                commits: 0,
                contests_played: 0,
                xp_earned: numCount * 10,
                study_minutes: numCount * 15,
              },
            });
          }
        }
      }
    }

    // 5. Update coding streak details on dashboard summary
    await prisma.dashboard_summary.upsert({
      where: { user_id: userId },
      update: {
        total_solved: data.totalSolved || 0,
        streak: data.streak || 1,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        total_solved: data.totalSolved || 0,
        streak: data.streak || 1,
        updated_at: new Date(),
      },
    });

    return profile;
  } catch (error) {
    console.error('[LEETCODE SYNC ERROR]', error.message);
    throw error;
  }
};

/**
 * Retrieves the stored LeetCode profile information.
 */
const getLeetcodeProfile = async (userId) => {
  return prisma.leetcode_profiles.findUnique({
    where: { user_id: userId },
  });
};

/**
 * Returns solved problem stats and categories.
 */
const getSolvedProblems = async (userId) => {
  const profile = await getLeetcodeProfile(userId);
  if (!profile) return null;

  return {
    total: profile.problems_solved,
    easy: profile.easy,
    medium: profile.medium,
    hard: profile.hard,
  };
};

/**
 * Returns contest history details.
 */
const getContestHistory = async (userId) => {
  return prisma.contest_history.findMany({
    where: {
      user_id: userId,
      contests: {
        platform: 'leetcode',
      },
    },
    include: {
      contests: true,
    },
    orderBy: { date: 'desc' },
  });
};

/**
 * Returns topic mastery statistics.
 */
const getTopicStatistics = async (userId) => {
  return prisma.topic_mastery.findMany({
    where: { user_id: userId },
    orderBy: { solved: 'desc' },
  });
};

module.exports = {
  syncLeetcodeData,
  getLeetcodeProfile,
  getSolvedProblems,
  getContestHistory,
  getTopicStatistics,
};
