const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

// All notification endpoints require authentication
router.use(authenticate);

router.post('/', notificationController.createNotification);
router.get('/', notificationController.getNotifications);
router.patch('/read', notificationController.markAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);
router.get('/unread-count', notificationController.getUnreadCount);
router.get('/preferences', notificationController.getNotificationPreferences);
router.patch('/preferences', notificationController.updateNotificationPreferences);

module.exports = router;
