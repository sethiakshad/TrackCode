const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * AI Provider / Client abstraction wrapper.
 * Integrates with Google Gemini API to generate insights.
 */
class AIProvider {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || '';
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
    }
  }
  /**
   * Generates a weekly progress analysis report.
   * @param {Object} userData - User progress metrics.
   * @returns {Promise<Object>} Formatted report object.
   */
  async generateWeeklyReport(userData) {
    // Placeholder AI generation logic.
    // In production, instantiate Google Gen AI / OpenAI SDK here and pass formatted prompts.
    return {
      overview: `Based on your recent weekly activity, you resolved ${userData.problemsSolvedCount || 0} problems.`,
      strengths: userData.strengths || ['Good coding speed', 'Consistent problem-solving streak'],
      weaknesses: userData.weaknesses || ['Needs improvement in dynamic programming', 'Lower accuracy on hard problems'],
      actionPlan: [
        'Practice 3 Medium dynamic programming problems.',
        'Review correctness rates in contest submissions.',
      ],
    };
  }

  /**
   * Generates personalized problem recommendations.
   * @param {Object} userPerformance - User's masteries and history.
   * @param {Array<Object>} availableProblems - Pool of problems to choose from.
   * @returns {Promise<Array<Object>>} List of recommended problems with reasoned justifications.
   */
  async generateRecommendations(userPerformance, availableProblems) {
    // Select problems and construct custom justifications based on performance.
    return availableProblems.slice(0, 3).map((problem, index) => ({
      problemId: problem.id,
      reason: `Highly relevant for improving your topic mastery in ${problem.topic || 'Algorithms'}. Priority ${index + 1}.`,
      priority: index + 1,
    }));
  }

  /**
   * Generates a curriculum / learning roadmap with ordered steps.
   * @param {string} topic - Subject of the learning roadmap.
   * @returns {Promise<Object>} Learning roadmap with steps structure.
   */
  async generateRoadmap(topic) {
    return {
      title: `${topic} Mastery Roadmap`,
      description: `Structured curriculum targeting expertise in ${topic}.`,
      steps: [
        {
          title: `Introduction to ${topic}`,
          description: `Learn the fundamentals and core properties.`,
          stepOrder: 1,
        },
        {
          title: `Intermediate applications of ${topic}`,
          description: `Solve medium difficulty challenges matching standard patterns.`,
          stepOrder: 2,
        },
        {
          title: `Advanced optimization & complex patterns`,
          description: `Analyze edge cases, runtime optimizations, and competitive programming style issues.`,
          stepOrder: 3,
        },
      ],
    };
  }

  /**
   * Generates a conversational agent message response.
   * @param {string} chatHistory - Previous message history.
   * @param {string} prompt - Current user message.
   * @returns {Promise<string>} Agent response string.
   */
  async generateChatMessage(chatHistory, prompt, userData = {}) {
    if (!this.model) {
      return `This is a simulated AI assistant response. You asked: "${prompt}". Please configure GEMINI_API_KEY in your .env file to enable the AI Coach.`;
    }

    try {
      const fullPrompt = `You are TrackCode AI Coach.

You are given verified analytics belonging to the currently authenticated TrackCode user.

USER DATA:
${JSON.stringify(userData, null, 2)}

Use this data to answer the user's question.

IMPORTANT RULES:
- Use the provided user data.
- Do not invent statistics.
- Do not ask the user to provide data that is already available.
- Do not confuse this user's data with another user.
- If a metric is unavailable, explicitly say that it is unavailable.
- Base conclusions on actual statistics.
- Explain the reasoning behind your conclusions.
- Give actionable coaching.
- Do not recommend individual coding problems.

Here is the conversation history:
${chatHistory}

User: ${prompt}
AI Coach:`;
      const result = await this.model.generateContent(fullPrompt);
      return result.response.text();
    } catch (error) {
      console.error("Gemini API Error in generateChatMessage:", error);
      return `I'm having trouble connecting to my brain right now. Please try again later. Error: ${error.message}`;
    }
  }

  /**
   * Generates summary summary analytics.
   * @param {Object} statsData - Stats numbers and graphs.
   * @returns {Promise<string>} Summary text response.
   */
  async generateSummary(statsData) {
    if (!this.model) {
      return `AI Summary: You solved ${statsData.totalSolved || 0} total problems with a streak of ${statsData.streak || 0} days. Your active focus area remains ${statsData.focusArea || 'General Algorithms'}. (Configure GEMINI_API_KEY for personalized feedback)`;
    }

    try {
      const prompt = `You are an encouraging and expert AI coding coach. 
Analyze the following user analytics JSON and provide a short, motivating, 2-3 sentence summary of their progress. 
Highlight their streak or total solved if impressive, and suggest what they should focus on next based on their focus area.

User Analytics JSON:
${JSON.stringify(statsData, null, 2)}

Provide only the summary text, no formatting or markdown.`;

      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error("Gemini API Error in generateSummary:", error);
      return `You're making great progress! You solved ${statsData.totalSolved || 0} total problems. Keep consistency by solving at least 1 medium problem every day.`;
    }
  }
}

module.exports = new AIProvider();
