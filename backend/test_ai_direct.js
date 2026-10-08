require('dotenv').config();
const axios = require('axios');

async function test() {
  try {
    // We need to bypass auth or use a valid token.
    // Since we don't have a token, we can just test the generateChatMessage directly.
    const aiProvider = require('./src/services/aiProvider');
    const res = await aiProvider.generateChatMessage("Hello", "Tell me my weak topics", { profile: { totalSolved: 965 } });
    console.log("AI Response:", res);
  } catch (err) {
    console.error("Test Error:", err);
  }
}
test();
