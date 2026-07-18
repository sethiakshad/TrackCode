const notificationService = require('../services/notificationService');

const createNotification = async (req, res, next) => {
  try {
    const { title, body, type, metadata } = req.body;
    if (!title) {
      return res.status(400).json({
        status: 'error',
        message: 'Notification title is required',
      });
    }

    const notification = await notificationService.createNotification(req.userId, {
      title,
      body,
      type,
      metadata,
    });

    res.status(201).json({
      status: 'success',
      message: 'Notification created',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
};

const getNotifications = async (req, res, next) => {
  try {
    const notifications = await notificationService.getNotifications(req.userId);
    res.json({
      status: 'success',
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.body;
    await notificationService.markAsRead(req.userId, notificationId || null);
    res.json({
      status: 'success',
      message: notificationId ? 'Notification marked as read' : 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// Handles PATCH /notifications/:notificationId/read (called by frontend)
const markSingleRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    await notificationService.markAsRead(req.userId, notificationId);
    res.json({
      status: 'success',
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

// Handles PATCH /notifications/read-all (called by frontend)
const markAllAsRead = async (req, res, next) => {
  try {
    await notificationService.markAsRead(req.userId, null);
    res.json({ status: 'success', message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    await notificationService.deleteNotification(req.userId, notificationId);
    res.json({
      status: 'success',
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
};

const getUnreadCount = async (req, res, next) => {
  try {
    const data = await notificationService.getUnreadCount(req.userId);
    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getNotificationPreferences = async (req, res, next) => {
  try {
    const prefs = await notificationService.getNotificationPreferences(req.userId);
    res.json({
      status: 'success',
      data: prefs,
    });
  } catch (error) {
    next(error);
  }
};

const updateNotificationPreferences = async (req, res, next) => {
  try {
    const { email_notifications } = req.body;
    if (typeof email_notifications !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'email_notifications must be a boolean',
      });
    }

    const prefs = await notificationService.updateNotificationPreferences(req.userId, email_notifications);
    res.json({
      status: 'success',
      message: 'Notification preferences updated',
      data: prefs,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotification,
  getNotifications,
  markAsRead,
  markSingleRead,
  markAllAsRead,
  deleteNotification,
  getUnreadCount,
  getNotificationPreferences,
  updateNotificationPreferences,
};
