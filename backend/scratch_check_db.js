require('dotenv').config();
const prisma = require('./src/config/prisma');

async function main() {
  const summaries = await prisma.dashboard_summary.findMany();
  console.log("Found summaries:", summaries.length);
  for (const s of summaries) {
    console.log(`User: ${s.user_id}`);
    console.log(`weekly_progress:`, JSON.stringify(s.weekly_progress, null, 2));
  }
}
main().catch(console.error);
