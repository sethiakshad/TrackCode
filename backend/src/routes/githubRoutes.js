const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const githubController = require('../controllers/githubController');

// All GitHub endpoints require authentication
router.use(authenticate);

router.post('/connect', githubController.connectGitHub);
router.get('/profile', githubController.getGitHubProfile);
router.post('/sync', githubController.syncGitHub);

module.exports = router;
