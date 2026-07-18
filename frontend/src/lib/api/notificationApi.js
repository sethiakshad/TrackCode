import apiClient from '../axios';

/**
 * Get user's notifications.
 */
export async function getNotifications() {
  const response = await apiClient.get('/notifications');
  return response.data;
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId) {
  const response = await apiClient.patch(`/notifications/${notificationId}/read`);
  return response.data;
}

/**
 * Mark all notifications as read.
 */
export async function markAllAsRead() {
  const response = await apiClient.patch('/notifications/read-all');
  return response.data;
}

/**
 * Delete a notification.
 */
export async function deleteNotification(notificationId) {
  await apiClient.delete(`/notifications/${notificationId}`);
  return true;
}
