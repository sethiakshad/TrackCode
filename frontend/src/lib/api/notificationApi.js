import { supabase } from '../../utils/supabase';

/**
 * Get user's notifications.
 */
export async function getNotifications(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, message, type, read, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) throw error;
  return data ?? [];
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Mark all notifications as read.
 */
export async function markAllAsRead(userId) {
  const { data, error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', userId)
    .select();

  if (error) throw error;
  return data;
}

/**
 * Delete a notification.
 */
export async function deleteNotification(notificationId) {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
  return true;
}
