import apiClient from '../axios';

/**
 * Get user's friends list (accepted relationships) with profiles.
 */
export async function getFriends() {
  const response = await apiClient.get('/friends/list');
  return response.data;
}

/**
 * Get incoming / outgoing friend requests.
 */
export async function getFriendRequests() {
  const response = await apiClient.get('/friends/requests');
  return response.data;
}

/**
 * Send a friend request by username.
 */
export async function sendFriendRequest(username) {
  const response = await apiClient.post('/friends/request', { username });
  return response.data;
}

/**
 * Accept a friend request.
 */
export async function acceptFriendRequest(requestId) {
  const response = await apiClient.post('/friends/accept', { requestId });
  return response.data;
}

/**
 * Reject / Cancel / Remove friendship.
 */
export async function removeFriendship(requestId) {
  // Can be reject or remove endpoint. Wait, frontend passes requestId.
  // We'll call reject for pending, or remove by friendId for accepted.
  // The backend handles remove by `friendId` and reject by `requestId`.
  // We'll use the reject endpoint if it's a request.
  const response = await apiClient.post('/friends/reject', { requestId });
  return response.data;
}

export async function removeFriend(friendId) {
  const response = await apiClient.post('/friends/remove', { friendId });
  return response.data;
}

/**
 * Get Leaderboard data (Friends + User ranked by XP).
 */
export async function getFriendsLeaderboard() {
  const response = await apiClient.get('/friends/leaderboard');
  return response.data?.data || [];
}
