const prisma = require('../config/prisma');

/**
 * Create a new notification for a specific user.
 */
const createNotification = async (userId, data) => {
  return prisma.notifications.create({
    data: {
      user_id: userId,
      title: data.title,
      body: data.body,
      type: data.type || 'system',
      metadata: data.metadata || {},
      read: false,
    },
  });
};

/**
 * Fetch all notifications for a specific user.
 */
const getNotifications = async (userId) => {
  return prisma.notifications.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
};

/**
 * Mark a single notification or all notifications as read.
 */
const markAsRead = async (userId, notificationId) => {
  if (notificationId) {
    return prisma.notifications.updateMany({
      where: { id: notificationId, user_id: userId },
      data: { read: true },
    });
  } else {
    // If no notification ID, mark all as read
    return prisma.notifications.updateMany({
      where: { user_id: userId, read: false },
      data: { read: true },
    });
  }
};

/**
 * Delete a specific notification.
 */
const deleteNotification = async (userId, notificationId) => {
  return prisma.notifications.deleteMany({
    where: { id: notificationId, user_id: userId },
  });
};

/**
 * Get count of unread notifications.
 */
const getUnreadCount = async (userId) => {
  const count = await prisma.notifications.count({
    where: { user_id: userId, read: false },
  });
  return { unreadCount: count };
};

/**
 * Fetch user notification preferences from user_settings.
 */
const getNotificationPreferences = async (userId) => {
  let settings = await prisma.user_settings.findUnique({
    where: { user_id: userId },
  });

  if (!settings) {
    // Return default settings if none found
    settings = await prisma.user_settings.create({
      data: {
        user_id: userId,
        theme: 'system',
        email_notifications: true,
        profile_visibility: 'public',
      },
    });
  }

  return {
    email_notifications: settings.email_notifications,
  };
};

/**
 * Update user notification preferences.
 */
const updateNotificationPreferences = async (userId, emailNotifications) => {
  const settings = await prisma.user_settings.upsert({
    where: { user_id: userId },
    update: {
      email_notifications: emailNotifications,
      updated_at: new Date(),
    },
    create: {
      user_id: userId,
      theme: 'system',
      email_notifications: emailNotifications,
      profile_visibility: 'public',
    },
  });

  return {
    email_notifications: settings.email_notifications,
  };
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  deleteNotification,
  getUnreadCount,
  getNotificationPreferences,
  updateNotificationPreferences,
};
