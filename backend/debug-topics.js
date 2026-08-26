/**
 * Debug script: Trace topic data at every layer.
 * Run: node -r dotenv/config debug-topics.js
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

const TEST_USER_ID = '5db32d9d-aead-47c0-b687-e1ec5173e346';

async function debugTopics() {
  // LAYER 1: What does LeetCode actually return for tagProblemCounts?
  console.log('=== LAYER 1: RAW LEETCODE API RESPONSE ===');
  const lcQuery = `
    query getUserProfile($username: String!) {
      matchedUser(username: $username) {
        tagProblemCounts {
          advanced { tagName tagSlug problemsSolved }
          intermediate { tagName tagSlug problemsSolved }
          fundamental { tagName tagSlug problemsSolved }
        }
      }
    }
  `;
  try {
    const lcResp = await axios.post('https://leetcode.com/graphql', 
      { query: lcQuery, variables: { username: 'sethiakshad' } },
      { headers: { 'Content-Type': 'application/json', 'Referer': 'https://leetcode.com' }, timeout: 15000 }
    );
    const tagCounts = lcResp.data?.data?.matchedUser?.tagProblemCounts;
    console.log('fundamental count:', tagCounts?.fundamental?.length || 0);
    console.log('intermediate count:', tagCounts?.intermediate?.length || 0);
    console.log('advanced count:', tagCounts?.advanced?.length || 0);
    console.log('\nFirst 5 fundamental tags:');
    (tagCounts?.fundamental || []).slice(0, 5).forEach(t => {
      console.log(`  ${t.tagName}: ${t.problemsSolved} problems (type: ${typeof t.problemsSolved})`);
    });
    console.log('\nFirst 5 intermediate tags:');
    (tagCounts?.intermediate || []).slice(0, 5).forEach(t => {
      console.log(`  ${t.tagName}: ${t.problemsSolved} problems (type: ${typeof t.problemsSolved})`);
    });
    const allTags = [
      ...(tagCounts?.fundamental || []),
      ...(tagCounts?.intermediate || []),
      ...(tagCounts?.advanced || []),
    ];
    console.log('\nTotal unique tags from LeetCode:', allTags.length);
  } catch (err) {
    console.log('LeetCode API error:', err.message);
  }

  // LAYER 2: What's in the topic_mastery database table?
  console.log('\n=== LAYER 2: DATABASE topic_mastery TABLE ===');
  const { data: dbTopics, error: dbErr } = await supabase
    .from('topic_mastery')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .order('solved', { ascending: false })
    .limit(15);
  
  if (dbErr) {
    console.log('DB Error:', dbErr.message);
  } else {
    console.log('Total rows:', dbTopics?.length || 0);
    console.log('\nTop 10 topics in DB:');
    (dbTopics || []).slice(0, 10).forEach(t => {
      console.log(`  ${t.topic}: solved=${t.solved}(${typeof t.solved}), accuracy=${t.accuracy}(${typeof t.accuracy}), mastery_score=${t.mastery_score}(${typeof t.mastery_score})`);
    });
  }

  // LAYER 3: What does analyticsService.getTopicMastery return?
  console.log('\n=== LAYER 3: analyticsService.getTopicMastery OUTPUT ===');
  // Manually replicate the current analyticsService logic
  const topics = dbTopics || [];
  
  const categoryMap = {
    'Array': 'Arrays', 'String': 'Strings', 'Hash Table': 'Hashing',
    'Math': 'Math', 'Dynamic Programming': 'Dynamic Programming',
    'Sorting': 'Sorting', 'Greedy': 'Greedy',
    'Depth-First Search': 'Graphs/Trees', 'Tree': 'Graphs/Trees',
    'Graph': 'Graphs/Trees', 'Binary Search': 'Binary Search',
    'Two Pointers': 'Two Pointers', 'Breadth-First Search': 'Graphs/Trees',
  };

  const aggregated = {};
  let maxSolved = 0;
  topics.forEach(t => {
    const mainCategory = categoryMap[t.topic] || null;
    if (!mainCategory) return;
    if (!aggregated[mainCategory]) {
      aggregated[mainCategory] = { topic: mainCategory, solved: 0, count: 0 };
    }
    aggregated[mainCategory].solved += (t.solved || 0);
    aggregated[mainCategory].count += 1;
  });

  const categories = Object.values(aggregated).filter(c => c.solved > 0);
  maxSolved = categories.reduce((m, c) => Math.max(m, c.solved), 1);

  const radarData = categories
    .map(c => ({
      subject: c.topic,
      solved: c.solved,
      value: Math.round((c.solved / maxSolved) * 100),
      fullMark: 100,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  console.log('Radar data:');
  radarData.forEach(r => {
    console.log(`  ${r.subject}: solved=${r.solved}, value=${r.value}, isNaN=${isNaN(r.value)}`);
  });

  // LAYER 4: What does the frontend API transform it into?
  console.log('\n=== LAYER 4: FRONTEND TRANSFORM (analyticsApi.js getTopicMastery) ===');
  // analyticsApi.js maps: { subject: t.topic, A: Math.round(t.mastery_score), ... }
  // But our new service returns { subject, solved, value, fullMark }
  // The Insights.jsx RadarChart uses dataKey="A" but our data has "value"
  // THIS IS THE BUG — dataKey mismatch
  console.log('Current RadarChart in Insights.jsx uses dataKey="A"');
  console.log('But getTopicMastery now returns objects with key "value", not "A"');
  console.log('This means the radar chart will show NOTHING or NaN');

  // Also check: what does analyticsApi.js actually do with the response?
  // It maps response.data to: { subject: t.topic, A: Math.round(t.mastery_score), solved: t.solved, ... }
  // But our service now returns { subject, solved, value, fullMark } — no mastery_score field!
  // Math.round(undefined) = NaN ← THIS IS THE NaN SOURCE

  console.log('\n=== NaN ROOT CAUSE IDENTIFIED ===');
  console.log('analyticsApi.js line 11: A: Math.round(t.mastery_score)');
  console.log('But analyticsService now returns objects WITHOUT mastery_score field');
  console.log('Math.round(undefined) = NaN');
  console.log('And RadarChart uses dataKey="A" but data has no "A" key');
}

debugTopics();
