const axios = require('axios');
const prisma = require('../config/prisma');

/**
 * Service to sync and query LeetCode profile and platform stats.
 * Uses LeetCode's official public GraphQL endpoint directly.
 */

const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql';

// Common headers for LeetCode GraphQL
const LC_HEADERS = {
  'Content-Type': 'application/json',
  'Referer': 'https://leetcode.com',
  'Origin': 'https://leetcode.com',
};

/**
 * Make a GraphQL request to LeetCode with proper error handling.
 */
const leetcodeGraphQL = async (query, variables = {}) => {
  try {
    const response = await axios.post(
      LEETCODE_GRAPHQL_URL,
      { query, variables },
      { headers: LC_HEADERS, timeout: 15000 }
    );
    return response.data;
  } catch (err) {
    if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
      const error = new Error('LeetCode API timed out. Please try again.');
      error.statusCode = 504;
      throw error;
    }
    if (err.response?.status === 429) {
      const error = new Error('LeetCode rate limit reached. Please wait a minute and try again.');
      error.statusCode = 429;
      throw error;
    }
    if (err.response?.status >= 500) {
      const error = new Error('LeetCode servers are currently unavailable. Please try again later.');
      error.statusCode = 502;
      throw error;
    }
    throw err;
  }
};

/**
 * Fetch LeetCode profile data via GraphQL without saving to DB.
 * Used by the "preview" endpoint so the frontend can show stats before confirming.
 */
const fetchLeetCodePreview = async (username) => {
  const query = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        username
        profile {
          ranking
          realName
          userAvatar
          reputation
          aboutMe
          company
          school
          websites
        }
        submitStats: submitStatsGlobal {
          acSubmissionNum {
            difficulty
            count
          }
          totalSubmissionNum {
            difficulty
            count
          }
        }
        tagProblemCounts {
          advanced { tagName tagSlug problemsSolved }
          intermediate { tagName tagSlug problemsSolved }
          fundamental { tagName tagSlug problemsSolved }
        }
      }
      userContestRanking(username: $username) {
        attendedContestsCount
        rating
        globalRanking
        topPercentage
      }
    }
  `;

  const result = await leetcodeGraphQL(query, { username });

  // Check for "user not found" errors
  if (result.errors) {
    const notFound = result.errors.some(e =>
      e.message?.toLowerCase().includes('does not exist') ||
      e.message?.toLowerCase().includes('not found')
    );
    if (notFound || !result.data?.matchedUser) {
      const error = new Error(`User "${username}" not found on LeetCode.`);
      error.statusCode = 404;
      throw error;
    }
  }

  if (!result.data?.matchedUser) {
    const error = new Error(`User "${username}" not found on LeetCode.`);
    error.statusCode = 404;
    throw error;
  }

  const user = result.data.matchedUser;
  const stats = user.submitStats?.acSubmissionNum || [];
  const totalStats = user.submitStats?.totalSubmissionNum || [];
  const contestRanking = result.data.userContestRanking;
  const profile = user.profile || {};

  const totalSolved = stats.find(s => s.difficulty === 'All')?.count || 0;
  const easySolved = stats.find(s => s.difficulty === 'Easy')?.count || 0;
  const mediumSolved = stats.find(s => s.difficulty === 'Medium')?.count || 0;
  const hardSolved = stats.find(s => s.difficulty === 'Hard')?.count || 0;

  const totalSubmissions = totalStats.find(s => s.difficulty === 'All')?.count || 0;
  const acSubmissions = stats.find(s => s.difficulty === 'All')?.count || 0;
  const acceptanceRate = totalSubmissions > 0 ? (acSubmissions / totalSubmissions) * 100 : 0;

  return {
    username: user.username,
    ranking: profile.ranking || null,
    contest_rating: contestRanking ? Math.round(contestRanking.rating) : null,
    contest_ranking: contestRanking?.globalRanking || null,
    contests_attended: contestRanking?.attendedContestsCount || 0,
    problems_solved: totalSolved,
    easy: easySolved,
    medium: mediumSolved,
    hard: hardSolved,
    avatar: profile.userAvatar || null,
    about: profile.aboutMe || '',
    company: profile.company || '',
    school: profile.school || '',
    website: profile.websites || [],
    reputation: profile.reputation || 0,
    total_submissions: totalSubmissions,
    ac_submissions: acSubmissions,
    acceptance_rate: acceptanceRate,
    tagProblemCounts: user.tagProblemCounts || null,
  };
};

/**
 * Fetch submission calendar and recent submissions for daily stats sync.
 */
const fetchLeetCodeActivity = async (username) => {
  const query = `
    query getUserActivity($username: String!) {
      matchedUser(username: $username) {
        submissionCalendar
      }
      recentSubmissionList(username: $username, limit: 50) {
        title
        titleSlug
        timestamp
        statusDisplay
      }
    }
  `;

  const result = await leetcodeGraphQL(query, { username });
  return {
    submissionCalendar: result.data?.matchedUser?.submissionCalendar || '{}',
    recentSubmissions: result.data?.recentSubmissionList || [],
  };
};

/**
 * Syncs LeetCode profile, solved counts, rating, submissions, topics and streaks.
 */
const syncLeetcodeData = async (userId, username) => {
  try {
    // 1. Fetch profile + solved stats + contest rating
    const preview = await fetchLeetCodePreview(username);

    // Calculate streaks from submissionCalendar
    let currentStreak = 0;
    let longestStreak = 0;
    
    try {
      const activity = await fetchLeetCodeActivity(username);
      let calendar = activity.submissionCalendar;
      if (typeof calendar === 'string') {
        try { calendar = JSON.parse(calendar); } catch (e) { calendar = {}; }
      }
      
      if (typeof calendar === 'object' && calendar !== null) {
        const timestamps = Object.keys(calendar)
          .map(ts => parseInt(ts, 10))
          .filter(ts => !isNaN(ts) && calendar[ts] > 0)
          .sort((a, b) => a - b);
          
        if (timestamps.length > 0) {
          let tempStreak = 1;
          longestStreak = 1;
          
          for (let i = 1; i < timestamps.length; i++) {
            const prevDate = new Date(timestamps[i-1] * 1000);
            prevDate.setHours(0, 0, 0, 0);
            const currDate = new Date(timestamps[i] * 1000);
            currDate.setHours(0, 0, 0, 0);
            
            const diffDays = Math.round((currDate - prevDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              tempStreak++;
              longestStreak = Math.max(longestStreak, tempStreak);
            } else if (diffDays > 1) {
              tempStreak = 1;
            }
          }
          
          // Check if current streak is still active (today or yesterday)
          const lastActiveDate = new Date(timestamps[timestamps.length - 1] * 1000);
          lastActiveDate.setHours(0, 0, 0, 0);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffFromToday = Math.round((today - lastActiveDate) / (1000 * 60 * 60 * 24));
          
          if (diffFromToday <= 1) {
            currentStreak = tempStreak;
          } else {
            currentStreak = 0;
          }
        }
      }
      
      // Store activity for step 4
      preview.activity = activity;
    } catch (e) {
      console.warn('[LEETCODE SYNC] Failed to calculate streak:', e.message);
    }

    // 2. Upsert LeetCode profile in DB
    const profile = await prisma.leetcode_profiles.upsert({
      where: { user_id: userId },
      update: {
        username: preview.username,
        ranking: preview.ranking,
        contest_rating: preview.contest_rating,
        problems_solved: preview.problems_solved,
        easy: preview.easy,
        medium: preview.medium,
        hard: preview.hard,
        synced_at: new Date(),
      },
      create: {
        user_id: userId,
        username: preview.username,
        ranking: preview.ranking,
        contest_rating: preview.contest_rating,
        problems_solved: preview.problems_solved,
        easy: preview.easy,
        medium: preview.medium,
        hard: preview.hard,
        synced_at: new Date(),
      },
    });

    // 3. Sync topic mastery from tag problem counts
    if (preview.tagProblemCounts) {
      const allTags = [
        ...(preview.tagProblemCounts.advanced || []),
        ...(preview.tagProblemCounts.intermediate || []),
        ...(preview.tagProblemCounts.fundamental || []),
      ];

      // Process all tags in batches of 10 to avoid overwhelming the API
      const tagBatchSize = 10;
      for (let i = 0; i < allTags.length; i += tagBatchSize) {
        const chunk = allTags.slice(i, i + tagBatchSize);
        await Promise.all(
          chunk.map(async (tag) => {
            const solved = Number(tag.problemsSolved) || 0;
            // mastery_score in DB schema is NUMERIC(5, 2) (max 999.99)
            const masteryScore = Math.min(solved * 10, 999.99);
            try {
              await prisma.topic_mastery.upsert({
                where: {
                  user_id_topic: {
                    user_id: userId,
                    topic: tag.tagName,
                  },
                },
                update: {
                  solved: solved,
                  accuracy: 90.00,
                  mastery_score: masteryScore,
                  updated_at: new Date(),
                },
                create: {
                  user_id: userId,
                  topic: tag.tagName,
                  solved: solved,
                  accuracy: 90.00,
                  mastery_score: masteryScore,
                  updated_at: new Date(),
                },
              });
            } catch (tagErr) {
              console.warn(`[LEETCODE SYNC] Failed to upsert topic "${tag.tagName}":`, tagErr.message);
            }
          })
        );
      }
    }

    // 4. Fetch activity data (submission calendar + recent submissions)
    let calendarEntriesCount = 0;
    try {
      const activity = preview.activity || await fetchLeetCodeActivity(username);

      // Parse submissionCalendar and upsert into daily_stats
      let calendar = activity.submissionCalendar;
      if (typeof calendar === 'string') {
        try { calendar = JSON.parse(calendar); } catch (e) { calendar = {}; }
      }
      if (typeof calendar === 'object' && calendar !== null) {
        const entries = Object.entries(calendar);
        const batchSize = 15;
        for (let i = 0; i < entries.length; i += batchSize) {
          const chunk = entries.slice(i, i + batchSize);
          await Promise.all(
            chunk.map(async ([timestampStr, count]) => {
              const ts = parseInt(timestampStr, 10);
              if (!isNaN(ts)) {
                const d = new Date(ts * 1000);
                const dateStr = d.toISOString().split('T')[0];
                const numCount = parseInt(count, 10) || 0;
                if (numCount > 0) {
                  calendarEntriesCount++;
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
            })
          );
        }
      }
    } catch (activityErr) {
      console.warn('[LEETCODE SYNC] Activity fetch failed (non-critical):', activityErr.message);
    }

    // Fallback: If submissionCalendar was empty but user has solved problems
    if (calendarEntriesCount === 0 && preview.problems_solved > 0) {
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const activeSolved = Math.min(preview.problems_solved, 4);
      await prisma.daily_stats.upsert({
        where: {
          user_id_date: {
            user_id: userId,
            date: new Date(todayStr),
          },
        },
        update: {
          problems_solved: activeSolved,
        },
        create: {
          user_id: userId,
          date: new Date(todayStr),
          problems_solved: activeSolved,
          commits: 0,
          contests_played: 0,
          xp_earned: activeSolved * 10,
          study_minutes: activeSolved * 15,
        },
      });
    }

    // 5. Update dashboard summary
    await prisma.dashboard_summary.upsert({
      where: { user_id: userId },
      update: {
        total_solved: preview.problems_solved,
        contest_rating: preview.contest_rating || 0,
        streak: currentStreak,
        updated_at: new Date(),
      },
      create: {
        user_id: userId,
        total_solved: preview.problems_solved,
        contest_rating: preview.contest_rating || 0,
        streak: currentStreak,
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
  fetchLeetCodePreview,
  syncLeetcodeData,
  getLeetcodeProfile,
  getSolvedProblems,
  getContestHistory,
  getTopicStatistics,
};
