const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const friendController = require('../controllers/friendController');

// All friends endpoints require authentication
router.use(authenticate);

router.post('/request', friendController.sendFriendRequest);
router.post('/accept', friendController.acceptFriendRequest);
router.post('/reject', friendController.rejectFriendRequest);
router.post('/remove', friendController.removeFriend);
router.get('/list', friendController.getFriendList);
router.get('/search', friendController.searchUsers);
router.get('/activity', friendController.getFriendsActivity);
router.get('/leaderboard', friendController.getLeaderboard);

module.exports = router;
