const aiService = require('../services/aiService');

const generateWeeklyReport = async (req, res, next) => {
  try {
    const report = await aiService.generateWeeklyReport(req.userId);
    res.status(201).json({
      status: 'success',
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

const getWeeklyReports = async (req, res, next) => {
  try {
    const reports = await aiService.getWeeklyReports(req.userId);
    res.json({
      status: 'success',
      data: reports,
    });
  } catch (error) {
    next(error);
  }
};

const generateRecommendations = async (req, res, next) => {
  try {
    const recs = await aiService.generateRecommendations(req.userId);
    res.status(201).json({
      status: 'success',
      data: recs,
    });
  } catch (error) {
    next(error);
  }
};

const getRecommendations = async (req, res, next) => {
  try {
    const recs = await aiService.getRecommendations(req.userId);
    res.json({
      status: 'success',
      data: recs,
    });
  } catch (error) {
    next(error);
  }
};

const generateLearningRoadmap = async (req, res, next) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({
        status: 'error',
        message: 'Roadmap topic is required',
      });
    }

    const roadmap = await aiService.generateLearningRoadmap(req.userId, topic);
    res.status(201).json({
      status: 'success',
      data: roadmap,
    });
  } catch (error) {
    next(error);
  }
};

const getLearningRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await aiService.getLearningRoadmaps(req.userId);
    res.json({
      status: 'success',
      data: roadmaps,
    });
  } catch (error) {
    next(error);
  }
};

const updateRoadmapStep = async (req, res, next) => {
  try {
    const { stepId } = req.params;
    const { completed } = req.body;

    if (completed === undefined || typeof completed !== 'boolean') {
      return res.status(400).json({
        status: 'error',
        message: 'completed (boolean) parameter is required',
      });
    }

    const step = await aiService.updateRoadmapStep(req.userId, stepId, completed);
    res.json({
      status: 'success',
      message: 'Roadmap step updated successfully',
      data: step,
    });
  } catch (error) {
    next(error);
  }
};

const sendMessage = async (req, res, next) => {
  try {
    const { conversationId, message } = req.body;
    if (!message) {
      return res.status(400).json({
        status: 'error',
        message: 'Message content is required',
      });
    }

    const data = await aiService.sendMessage(req.userId, conversationId || null, message);
    res.status(201).json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

const getConversations = async (req, res, next) => {
  try {
    const convs = await aiService.getConversations(req.userId);
    res.json({
      status: 'success',
      data: convs,
    });
  } catch (error) {
    next(error);
  }
};

const getConversationHistory = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const history = await aiService.getConversationHistory(req.userId, conversationId);
    res.json({
      status: 'success',
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

const getAISummary = async (req, res, next) => {
  try {
    const summary = await aiService.getAISummary(req.userId);
    res.json({
      status: 'success',
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateWeeklyReport,
  getWeeklyReports,
  generateRecommendations,
  getRecommendations,
  generateLearningRoadmap,
  getLearningRoadmaps,
  updateRoadmapStep,
  sendMessage,
  getConversations,
  getConversationHistory,
  getAISummary,
};
