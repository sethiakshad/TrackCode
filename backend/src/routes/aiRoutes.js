const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const aiController = require('../controllers/aiController');

// All AI endpoints require authentication
router.use(authenticate);

// Reports
router.post('/report', aiController.generateWeeklyReport);
router.get('/reports', aiController.getWeeklyReports);

// Recommendations
router.post('/recommendations', aiController.generateRecommendations);
router.get('/recommendations', aiController.getRecommendations);

// Roadmap & Steps
router.post('/roadmap', aiController.generateLearningRoadmap);
router.get('/roadmaps', aiController.getLearningRoadmaps);
router.patch('/step/:stepId', aiController.updateRoadmapStep);

// Chat & Prompt History
router.post('/chat', aiController.sendMessage);
router.get('/conversations', aiController.getConversations);
router.get('/conversation/:conversationId', aiController.getConversationHistory);

// AI Summary
router.get('/summary', aiController.getAISummary);

module.exports = router;
