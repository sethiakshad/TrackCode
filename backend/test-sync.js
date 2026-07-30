require('dotenv').config();
const { connectAccount, syncCodeforcesSubmissions } = require('./src/services/settingsService');
const leetcodeService = require('./src/services/leetcodeService');
const githubService = require('./src/services/githubService');
const userId = '59831244-36c3-4066-973d-0f73de3569ac'; // Current test user

async function testSync() {
  console.log('Testing sync logic...');
  try {
    console.log('Syncing LeetCode...');
    await leetcodeService.syncLeetcodeData(userId, 'akshadsethi');
    
    console.log('Syncing GitHub...');
    await githubService.connectGitHub(userId, 'sethiakshad');
    
    const p = require('./src/config/prisma');
    const stats = await p.daily_stats.findMany({ where: { user_id: userId }, take: 5, orderBy: { date: 'desc' } });
    console.log('Daily Stats:', stats);
  } catch(e) {
    console.error('Error:', e);
  }
}
testSync();
