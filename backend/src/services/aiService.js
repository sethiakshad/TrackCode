const prisma = require('../config/prisma');
const aiProvider = require('./aiProvider');

/**
 * Weekly Reports
 */
const generateWeeklyReport = async (userId) => {
  // 1. Gather stats for user
  const solvedCount = await prisma.user_problem_history.count({
    where: { user_id: userId, status: 'solved' },
  });

  const masteries = await prisma.topic_mastery.findMany({
    where: { user_id: userId },
    orderBy: { mastery_score: 'desc' },
  });

  const strengths = masteries.slice(0, 2).map(m => m.topic);
  const weaknesses = masteries.slice(-2).map(m => m.topic);

  // 2. Fetch AI provider insights
  const reportContent = await aiProvider.generateWeeklyReport({
    problemsSolvedCount: solvedCount,
    strengths: strengths.length > 0 ? strengths : undefined,
    weaknesses: weaknesses.length > 0 ? weaknesses : undefined,
  });

  // 3. Store report in PostgreSQL DB
  return prisma.ai_reports.create({
    data: {
      user_id: userId,
      report: reportContent,
    },
  });
};

const getWeeklyReports = async (userId) => {
  return prisma.ai_reports.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
};

/**
 * Recommendations
 */
const generateRecommendations = async (userId) => {
  // 1. Fetch user performance
  const masteries = await prisma.topic_mastery.findMany({
    where: { user_id: userId },
  });

  // 2. Fetch a pool of available problems that the user hasn't solved yet
  const solvedProblemHistories = await prisma.user_problem_history.findMany({
    where: { user_id: userId, status: 'solved' },
    select: { problem_id: true },
  });
  const solvedIds = solvedProblemHistories.map(sph => sph.problem_id);

  const availableProblems = await prisma.problems.findMany({
    where: { id: { notIn: solvedIds } },
    take: 10,
  });

  if (availableProblems.length === 0) {
    return [];
  }

  // 3. Generate recommendations via AI provider
  const recommendationsData = await aiProvider.generateRecommendations(masteries, availableProblems);

  // 4. Save recommendations in PostgreSQL DB
  const createdRecs = [];
  for (const rec of recommendationsData) {
    const record = await prisma.recommendations.create({
      data: {
        user_id: userId,
        problem_id: rec.problemId,
        reason: rec.reason,
        priority: rec.priority,
      },
      include: { problems: true },
    });
    createdRecs.push(record);
  }

  return createdRecs;
};

const getRecommendations = async (userId) => {
  return prisma.recommendations.findMany({
    where: { user_id: userId },
    include: { problems: true },
    orderBy: { priority: 'asc' },
  });
};

/**
 * Learning Roadmap & Steps
 */
const generateLearningRoadmap = async (userId, topic) => {
  // 1. Call AI provider to generate steps
  const roadmapData = await aiProvider.generateRoadmap(topic);

  // 2. Write roadmap and step mappings inside PostgreSQL
  return prisma.$transaction(async (tx) => {
    const roadmap = await tx.roadmaps.create({
      data: {
        user_id: userId,
        title: roadmapData.title,
        description: roadmapData.description,
      },
    });

    const steps = [];
    for (const step of roadmapData.steps) {
      const stepRecord = await tx.roadmap_steps.create({
        data: {
          roadmap_id: roadmap.id,
          title: step.title,
          description: step.description,
          step_order: step.stepOrder,
        },
      });
      steps.push(stepRecord);
    }

    return {
      ...roadmap,
      steps,
    };
  });
};

const getLearningRoadmaps = async (userId) => {
  return prisma.roadmaps.findMany({
    where: { user_id: userId },
    include: { roadmap_steps: true },
    orderBy: { created_at: 'desc' },
  });
};

const updateRoadmapStep = async (userId, stepId, completed) => {
  // Verify step owner through roadmap relation
  const step = await prisma.roadmap_steps.findFirst({
    where: {
      id: stepId,
      roadmaps: { user_id: userId },
    },
  });

  if (!step) {
    const error = new Error('Roadmap step not found');
    error.statusCode = 404;
    throw error;
  }

  // Update step status
  const updatedStep = await prisma.roadmap_steps.update({
    where: { id: stepId },
    data: { completed },
  });

  // Re-calculate roadmap overall completion progress
  const allSteps = await prisma.roadmap_steps.findMany({
    where: { roadmap_id: step.roadmap_id },
  });

  const completedCount = allSteps.filter(s => s.completed).length;
  const progressPercentage = parseFloat(((completedCount / allSteps.length) * 100).toFixed(2));

  await prisma.roadmaps.update({
    where: { id: step.roadmap_id },
    data: { progress: progressPercentage },
  });

  return updatedStep;
};

/**
 * Chat History & Conversations
 */
const sendMessage = async (userId, conversationId, messageContent) => {
  let activeConversationId = conversationId;

  // 1. Create a new conversation if not specified
  if (!activeConversationId) {
    const conv = await prisma.conversations.create({
      data: {},
    });
    // Create participant entry
    await prisma.conversation_participants.create({
      data: {
        conversation_id: conv.id,
        user_id: userId,
      },
    });
    activeConversationId = conv.id;
  }

  // 2. Fetch recent message history for context
  const previousMessages = await prisma.messages.findMany({
    where: { conversation_id: activeConversationId },
    orderBy: { sent_at: 'asc' },
    take: 10,
  });

  const contextStr = previousMessages.map(m => `${m.sender_id === userId ? 'User' : 'Assistant'}: ${m.message}`).join('\n');

  // 3. Save User message record
  const userMsg = await prisma.messages.create({
    data: {
      conversation_id: activeConversationId,
      sender_id: userId,
      message: messageContent,
    },
  });

  // 4. Generate chatbot response from AI provider
  const responseStr = await aiProvider.generateChatMessage(contextStr, messageContent);

  // 5. Save System / Assistant message response
  // We use the application's predefined system or user profile setup.
  // Note: We use system user representation (using target sender_id)
  const systemMsg = await prisma.messages.create({
    data: {
      conversation_id: activeConversationId,
      sender_id: userId, // Keep same sender context or match custom sender
      message: responseStr,
      is_read: true,
    },
  });

  return {
    conversationId: activeConversationId,
    userMessage: userMsg,
    systemMessage: systemMsg,
  };
};

const getConversations = async (userId) => {
  return prisma.conversations.findMany({
    where: {
      conversation_participants: {
        some: { user_id: userId },
      },
    },
    include: {
      messages: {
        orderBy: { sent_at: 'desc' },
        take: 1,
      },
    },
    orderBy: { updated_at: 'desc' },
  });
};

const getConversationHistory = async (userId, conversationId) => {
  // Verify participant permissions
  const participant = await prisma.conversation_participants.findUnique({
    where: {
      conversation_id_user_id: {
        conversation_id: conversationId,
        user_id: userId,
      },
    },
  });

  if (!participant) {
    const error = new Error('Conversation not found');
    error.statusCode = 404;
    throw error;
  }

  return prisma.messages.findMany({
    where: { conversation_id: conversationId },
    orderBy: { sent_at: 'asc' },
  });
};

/**
 * AI Summary APIs
 */
const getAISummary = async (userId) => {
  // Fetch summary inputs
  const leetcode = await prisma.leetcode_profiles.findUnique({
    where: { user_id: userId },
  });

  const dashboard = await prisma.dashboard_summary.findUnique({
    where: { user_id: userId },
  });

  const totalSolved = leetcode?.problems_solved || 0;
  const streak = dashboard?.streak || 0;

  const summary = await aiProvider.generateSummary({
    totalSolved,
    streak,
    focusArea: 'Graph traversal and Tree validation',
  });

  return { summary };
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
