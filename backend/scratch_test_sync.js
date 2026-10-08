require('dotenv').config();
const settingsService = require('./src/services/settingsService');
const prisma = require('./src/config/prisma');

async function main() {
  const userId = '5db32d9d-aead-47c0-b687-e1ec5173e346';
  
  const cf = await prisma.codeforces_profiles.findUnique({ where: { user_id: userId } });
  console.log("Found Codeforces profile:", cf?.username);
  
  if (cf && cf.username) {
    console.log("Running syncCodeforcesSubmissions for", cf.username);
    await settingsService.syncCodeforcesSubmissions(userId, cf.username);
    console.log("Done syncing Codeforces");
    
    const summary = await prisma.dashboard_summary.findUnique({ where: { user_id: userId } });
    console.log("Summary after sync:", JSON.stringify(summary.weekly_progress, null, 2));
  }
}
main().catch(console.error).finally(() => process.exit(0));
