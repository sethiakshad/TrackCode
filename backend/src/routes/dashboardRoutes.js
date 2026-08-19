const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const dashboardController = require('../controllers/dashboardController');

// All dashboard endpoints require authentication
router.use(authenticate);

router.get('/summary', dashboardController.getDashboardSummary);
router.get('/goals', dashboardController.getDailyGoals);
router.get('/activity', dashboardController.getActivityProgress);
router.get('/streak', dashboardController.getCodingStreak);
router.get('/github', dashboardController.getGithubSummary);
router.get('/leetcode', dashboardController.getLeetcodeSummary);
router.get('/contests', dashboardController.getContestSummary);
router.get('/weak-topics', dashboardController.getWeakTopics);
router.get('/achievements', dashboardController.getAchievements);
router.get('/upcoming-contests', dashboardController.getUpcomingContests);

module.exports = router;
