// Test script to check various LeetCode API endpoints

const usernames = ['akshadsethi', 'akshadsethi8605'];

async function testAlfaApi(username) {
  console.log(`\n--- alfa-leetcode-api for "${username}" ---`);
  try {
    const r = await fetch(`https://alfa-leetcode-api.onrender.com/${username}?t=${Date.now()}`);
    console.log(`Status: ${r.status} ${r.statusText}`);
    if (r.ok) {
      const d = await r.json();
      console.log(`totalSolved: ${d.totalSolved}, ranking: ${d.ranking}, avatar: ${d.avatar ? 'yes' : 'no'}`);
    } else {
      console.log(`Body: ${(await r.text()).substring(0, 200)}`);
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

async function testFaisalApi(username) {
  console.log(`\n--- faisalshohag-api for "${username}" ---`);
  try {
    const r = await fetch(`https://leetcode-api-faisalshohag.vercel.app/${username}`);
    console.log(`Status: ${r.status} ${r.statusText}`);
    if (r.ok) {
      const d = await r.json();
      console.log(`totalSolved: ${d.totalSolved}, ranking: ${d.ranking}, easySolved: ${d.easySolved}, recentSubs: ${d.recentSubmissions?.length || 0}`);
    } else {
      console.log(`Body: ${(await r.text()).substring(0, 200)}`);
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

async function testLeetCodeGraphQL(username) {
  console.log(`\n--- LeetCode GraphQL for "${username}" ---`);
  try {
    const query = `{
      matchedUser(username: "${username}") {
        username
        submitStats: submitStatsGlobal {
          acSubmissionNum { difficulty count }
        }
        profile { ranking realName userAvatar reputation }
        contestBadge { name }
      }
      userContestRanking(username: "${username}") {
        attendedContestsCount
        rating
        globalRanking
      }
    }`;

    const r = await fetch('https://leetcode.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
      },
      body: JSON.stringify({ query }),
    });
    console.log(`Status: ${r.status} ${r.statusText}`);
    if (r.ok) {
      const d = await r.json();
      console.log(JSON.stringify(d, null, 2));
    } else {
      console.log(`Body: ${(await r.text()).substring(0, 300)}`);
    }
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}

(async () => {
  for (const u of usernames) {
    await testFaisalApi(u);
    await testLeetCodeGraphQL(u);
  }
  // Test alfa separately - it's rate limited
  // await testAlfaApi(usernames[0]);
})();
