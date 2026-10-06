const axios = require('axios');
const prisma = require('../config/prisma');

/**
 * Service to communicate with GitHub API.
 */

/**
 * Fetches user profile from GitHub API.
 */
const fetchGitHubProfile = async (username) => {
  const response = await axios.get(`https://api.github.com/users/${username}`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
      // If we have a token, we can add authorization here, otherwise unauthenticated requests are limited.
    },
  });
  return response.data;
};

/**
 * Fetches user repositories from GitHub API.
 */
const fetchGitHubRepos = async (username) => {
  const response = await axios.get(`https://api.github.com/users/${username}/repos?per_page=100`, {
    headers: {
      Accept: 'application/vnd.github.v3+json',
    },
  });
  return response.data;
};

/**
 * Connects user profile to GitHub and performs initial sync.
 */
const connectGitHub = async (userId, username) => {
  const profileData = await fetchGitHubProfile(username);
  
  // Create or update GitHub profile in PostgreSQL
  const githubProfile = await prisma.github_profiles.upsert({
    where: { user_id: userId },
    update: {
      github_id: BigInt(profileData.id),
      username: profileData.login,
      avatar: profileData.avatar_url,
      followers: profileData.followers || 0,
      following: profileData.following || 0,
      public_repos: profileData.public_repos || 0,
      synced_at: new Date(),
    },
    create: {
      user_id: userId,
      github_id: BigInt(profileData.id),
      username: profileData.login,
      avatar: profileData.avatar_url,
      followers: profileData.followers || 0,
      following: profileData.following || 0,
      public_repos: profileData.public_repos || 0,
      synced_at: new Date(),
    },
  });

  // Sync repositories & commit events into daily_stats
  await syncUserRepositories(githubProfile.id, username);
  await syncGitHubEvents(userId, username);

  return githubProfile;
};

const syncGitHubEvents = async (userId, username) => {
  try {
    const response = await axios.get(`https://api.github.com/users/${username}/events`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    const events = response.data || [];
    const commitCountsByDate = {};

    for (const ev of events) {
      if (ev.type === 'PushEvent' && ev.created_at) {
        const dateStr = ev.created_at.split('T')[0];
        const commits = (ev.payload && Array.isArray(ev.payload.commits)) ? ev.payload.commits.length : 1;
        commitCountsByDate[dateStr] = (commitCountsByDate[dateStr] || 0) + commits;
      }
    }

    for (const [dateStr, commitCount] of Object.entries(commitCountsByDate)) {
      await prisma.daily_stats.upsert({
        where: {
          user_id_date: {
            user_id: userId,
            date: new Date(dateStr),
          },
        },
        update: {
          commits: commitCount,
        },
        create: {
          user_id: userId,
          date: new Date(dateStr),
          problems_solved: 0,
          commits: commitCount,
          contests_played: 0,
          xp_earned: commitCount * 5,
          study_minutes: commitCount * 10,
        },
      });
    }
  } catch (err) {
    console.warn('[GITHUB EVENTS SYNC WARN]', err.message);
  }
};

/**
 * Syncs repositories, stars, forks, and languages.
 */
const syncUserRepositories = async (githubProfileId, username) => {
  const repos = await fetchGitHubRepos(username);

  let totalStars = 0;
  let totalForks = 0;

  for (const repo of repos) {
    totalStars += repo.stargazers_count || 0;
    totalForks += repo.forks_count || 0;

    // Calculate mock health score based on open issues vs forks/stars
    const issues = repo.open_issues_count || 0;
    const stars = repo.stargazers_count || 0;
    const health = issues === 0 ? 100 : Math.max(0, Math.min(100, parseFloat(((stars / (stars + issues)) * 100).toFixed(2))));

    // Upsert repository record
    await prisma.repositories.upsert({
      where: {
        github_profile_id_repo_name: {
          github_profile_id: githubProfileId,
          repo_name: repo.name,
        },
      },
      update: {
        language: repo.language,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        open_issues: repo.open_issues_count || 0,
        health_score: health,
        updated_at: new Date(),
      },
      create: {
        github_profile_id: githubProfileId,
        repo_name: repo.name,
        language: repo.language,
        stars: repo.stargazers_count || 0,
        forks: repo.forks_count || 0,
        open_issues: repo.open_issues_count || 0,
        health_score: health,
        updated_at: new Date(),
      },
    });
  }

  // Update total aggregates on github profile
  await prisma.github_profiles.update({
    where: { id: githubProfileId },
    data: {
      total_stars: totalStars,
      total_commits: repos.length * 15, // Mocked total commits aggregates
      contribution_streak: 5,           // Mocked streak details
      synced_at: new Date(),
    },
  });
};

/**
 * Retrives github profiles and repository lists from PostgreSQL.
 */
const getGitHubProfile = async (userId) => {
  const profile = await prisma.github_profiles.findUnique({
    where: { user_id: userId },
    include: {
      repositories: true,
    },
  });

  if (!profile) return null;

  // 1. Calculate language breakdown
  const langCount = {};
  let totalRepos = 0;
  profile.repositories.forEach(repo => {
    if (repo.language) {
      langCount[repo.language] = (langCount[repo.language] || 0) + 1;
      totalRepos++;
    }
  });

  const languageColors = {
    'JavaScript': '#f7df1e',
    'TypeScript': '#3178c6',
    'Python': '#3572A5',
    'Java': '#b07219',
    'C++': '#f34b7d',
    'HTML': '#e34c26',
    'CSS': '#563d7c',
    'C#': '#178600',
    'Go': '#00ADD8'
  };

  const languages = Object.keys(langCount).map(lang => ({
    name: lang,
    value: Math.round((langCount[lang] / totalRepos) * 100),
    color: languageColors[lang] || '#' + Math.floor(Math.random()*16777215).toString(16)
  })).sort((a, b) => b.value - a.value);

  // 2. Fetch commit history from daily_stats
  const today = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setDate(today.getDate() - 364); // 52 weeks * 7 days = 364 days

  const dailyStats = await prisma.daily_stats.findMany({
    where: {
      user_id: userId,
      date: { gte: oneYearAgo }
    },
    select: { date: true, commits: true }
  });

  const commitMap = new Map();
  dailyStats.forEach(stat => {
    const dStr = stat.date.toISOString().split('T')[0];
    commitMap.set(dStr, stat.commits);
  });

  // Build 52-week calendar array (last 364 days, ending on today)
  const calendar = [];
  let currentDate = new Date(oneYearAgo);
  
  for (let w = 0; w < 52; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const dStr = currentDate.toISOString().split('T')[0];
      const commits = commitMap.get(dStr) || 0;
      
      let level = 0;
      if (commits > 10) level = 3;
      else if (commits > 4) level = 2;
      else if (commits > 0) level = 1;
      
      week.push({ level, commits, date: dStr });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    calendar.push(week);
  }

  // 3. Weekly commit history for the bar chart (last 4 weeks)
  const commitHistory = [];
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(today.getDate() - 28);
  let tempDate = new Date(fourWeeksAgo);

  for (let i = 1; i <= 4; i++) {
    let weeklyCommits = 0;
    for (let j = 0; j < 7; j++) {
      const dStr = tempDate.toISOString().split('T')[0];
      weeklyCommits += commitMap.get(dStr) || 0;
      tempDate.setDate(tempDate.getDate() + 1);
    }
    commitHistory.push({ week: `W${i}`, commits: weeklyCommits });
  }

  // Convert BigInt id to String for JSON serialization
  return {
    ...profile,
    github_id: profile.github_id.toString(),
    languages,
    calendar,
    commitHistory
  };
};

module.exports = {
  connectGitHub,
  getGitHubProfile,
  syncUserRepositories,
};
