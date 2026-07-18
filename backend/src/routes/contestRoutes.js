const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const contestController = require('../controllers/contestController');

// All contest routes require authentication
router.use(authenticate);

router.get('/history', contestController.getContestHistory);
router.get('/statistics', contestController.getContestStatistics);
router.get('/rating', contestController.getContestRating);
router.get('/predictions', contestController.getContestPredictions);
router.get('/graph', contestController.getContestGraphData);
router.get('/speed-analysis', contestController.getSpeedAnalysis);
router.get('/accuracy-analysis', contestController.getAccuracyAnalysis);

module.exports = router;
