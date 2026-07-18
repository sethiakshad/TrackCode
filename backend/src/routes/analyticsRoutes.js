const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const analyticsController = require('../controllers/analyticsController');

// All analytics endpoints require authentication
router.use(authenticate);

router.get('/topic-mastery', analyticsController.getTopicMastery);
router.get('/difficulty', analyticsController.getDifficultyDistribution);
router.get('/difficulty-distribution', analyticsController.getDifficultyDistribution); // alias
router.get('/acceptance-rate', analyticsController.getAcceptanceRate);
router.get('/heatmap', analyticsController.getHeatmapData);
router.get('/weekly', analyticsController.getWeeklyStatistics);
router.get('/monthly', analyticsController.getMonthlyStatistics);
router.get('/radar', analyticsController.getRadarChartData);
router.get('/progress', analyticsController.getProgressGraph);
router.get('/contest-performance', analyticsController.getContestPerformance);


module.exports = router;
