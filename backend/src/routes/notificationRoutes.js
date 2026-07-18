const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

// All notification endpoints require authentication
router.use(authenticate);

router.post('/', notificationController.createNotification);
router.get('/', notificationController.getNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read', notificationController.markAsRead);            // legacy: body has notificationId
router.patch('/read-all', notificationController.markAllAsRead);     // frontend: mark all read
router.patch('/:notificationId/read', notificationController.markSingleRead); // frontend: mark one read
router.delete('/:notificationId', notificationController.deleteNotification);
router.get('/preferences', notificationController.getNotificationPreferences);
router.patch('/preferences', notificationController.updateNotificationPreferences);

module.exports = router;
