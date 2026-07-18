import apiClient from '../axios';

/**
 * Update personal profile (name/display name).
 */
export async function updateProfile(profileData) {
  const response = await apiClient.patch('/profile', profileData);
  return response.data;
}

/**
 * Fetch connected platform profiles.
 */
export async function getConnectedHandles() {
  const response = await apiClient.get('/settings');
  // API returns { data: { settings, connectedAccounts: { github, leetcode, codeforces, codechef } } }
  return response.data?.data?.connectedAccounts || {
    github: null,
    leetcode: null,
    codeforces: null,
    codechef: null,
  };
}
