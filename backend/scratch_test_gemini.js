require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const key = process.env.GEMINI_API_KEY;
  console.log("API Key length:", key ? key.length : 0);
  
  if (!key) {
    console.log("No key found");
    return;
  }
  
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
    const result = await model.generateContent("Hello, who are you?");
    console.log("Success:", result.response.text());
  } catch (err) {
    console.error("Error calling Gemini API:", err.message);
  }
}
test();
