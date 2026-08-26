const prisma = require('./src/config/prisma');
const leetcodeService = require('./src/services/leetcodeService');

async function debugDataFlow() {
  try {
    // Get the first user
    const user = await prisma.public_users.findFirst({
      where: { email: 'akshadsethi123@gmail.com' } // from previous log
    });
    
    if (!user) {
      console.log('No user found');
      return;
    }
    
    const userId = user.id;
    console.log(`\n=== DEBUGGING DATA FLOW FOR USER: ${user.email} (${userId}) ===\n`);

    // 1. Raw DB Data
    const lcProfile = await prisma.leetcode_profiles.findUnique({ where: { user_id: userId } });
    const dashboardSummary = await prisma.dashboard_summary.findUnique({ where: { user_id: userId } });
    const dailyStats = await prisma.daily_stats.findMany({ where: { user_id: userId }, orderBy: { date: 'desc' }, take: 10 });
    
    // 2. Fetch raw LeetCode data
    let rawLC = null;
    let rawActivity = null;
    if (lcProfile && lcProfile.username) {
      // Actually fetch it using the raw GraphQL query to see exactly what we get
      rawLC = await leetcodeService.fetchLeetCodePreview(lcProfile.username);
      // Let's also get activity manually
      // We will just use the preview for now
    }

    console.log('--- 1. LEETCODE RAW DATA ---');
    if (rawLC) {
       console.log('username:', rawLC.username);
       console.log('totalSolved:', rawLC.problems_solved);
       console.log('easy:', rawLC.easy);
       console.log('medium:', rawLC.medium);
       console.log('hard:', rawLC.hard);
       console.log('accepted submissions:', rawLC.ac_submissions);
       console.log('total submissions:', rawLC.total_submissions);
       console.log('contest rating:', rawLC.contest_rating);
    } else {
       console.log('No username found to fetch LeetCode data.');
    }

    console.log('\n--- 2. DATABASE DATA ---');
    if (lcProfile) {
       console.log('username:', lcProfile.username);
       console.log('totalSolved:', lcProfile.problems_solved);
       console.log('easy:', lcProfile.easy);
       console.log('medium:', lcProfile.medium);
       console.log('hard:', lcProfile.hard);
       console.log('synced_at:', lcProfile.synced_at);
    } else {
       console.log('leetcode_profiles record is NULL');
    }
    
    if (dashboardSummary) {
       console.log('dashboard_summary.total_solved:', dashboardSummary.total_solved);
       console.log('dashboard_summary.streak:', dashboardSummary.streak);
    } else {
       console.log('dashboard_summary record is NULL');
    }

    console.log('\n--- 3. VERIFY INVARIANTS ---');
    if (rawLC) {
      const sum = rawLC.easy + rawLC.medium + rawLC.hard;
      console.log(`LeetCode Easy + Medium + Hard = ${sum}. Total Solved = ${rawLC.problems_solved}. Match? ${sum === rawLC.problems_solved}`);
    }
    if (lcProfile) {
      const sum = lcProfile.easy + lcProfile.medium + lcProfile.hard;
      console.log(`Database Easy + Medium + Hard = ${sum}. Total Solved = ${lcProfile.problems_solved}. Match? ${sum === lcProfile.problems_solved}`);
    }
    
    console.log('\n--- 4. DUPLICATES AUDIT ---');
    const allLcProfiles = await prisma.leetcode_profiles.count({ where: { user_id: userId }});
    console.log(`LeetCode Profiles for user: ${allLcProfiles}`);
    const allDashboards = await prisma.dashboard_summary.count({ where: { user_id: userId }});
    console.log(`Dashboard Summaries for user: ${allDashboards}`);
    
    console.log('\n--- 5. DAILY STATS ACTIVITY ---');
    console.log(`Showing last ${dailyStats.length} daily stats records:`);
    dailyStats.forEach(stat => {
      console.log(`Date: ${stat.date}, Solved: ${stat.problems_solved}`);
    });

  } catch (err) {
    console.error('Debug error:', err);
  }
}

debugDataFlow();
