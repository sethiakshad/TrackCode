const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const leetcodeController = require('../controllers/leetcodeController');

// All LeetCode endpoints require authentication
router.use(authenticate);

router.post('/connect', leetcodeController.connectLeetcode);
router.get('/profile', leetcodeController.getLeetcodeProfile);
router.get('/solved', leetcodeController.getSolvedProblems);
router.get('/contests', leetcodeController.getContestHistory);
router.get('/topics', leetcodeController.getTopicStatistics);
router.post('/sync', leetcodeController.syncLeetcode);

module.exports = router;
