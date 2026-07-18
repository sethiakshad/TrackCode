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

  // Sync repositories
  await syncUserRepositories(githubProfile.id, username);

  return githubProfile;
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

  // Convert BigInt id to String for JSON serialization
  return {
    ...profile,
    github_id: profile.github_id.toString(),
  };
};

module.exports = {
  connectGitHub,
  getGitHubProfile,
  syncUserRepositories,
};
