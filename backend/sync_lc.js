const axios = require('axios');
const prisma = require('./src/config/prisma.js');

async function syncLeetCode(userId, username) {
  const query = `
    query userContestRankingHistory($username: String!) {
      userContestRankingHistory(username: $username) {
        attended
        rating
        ranking
        contest {
          title
          startTime
        }
      }
    }
  `;
  try {
    const response = await axios.post('https://leetcode.com/graphql', {
      query,
      variables: { username }
    });
    
    if (!response.data.data || !response.data.data.userContestRankingHistory) {
       console.log('No history found'); return;
    }
    const history = response.data.data.userContestRankingHistory.filter(x => x.attended);
    
    // Remove mock LeetCode data
    const lcContests = await prisma.contests.findMany({ where: { platform: 'leetcode' } });
    if (lcContests.length > 0) {
      const historyItems = await prisma.contest_history.findMany({ where: { user_id: userId } });
      for (const item of historyItems) {
        if (lcContests.find(c => c.id === item.contest_id)) {
          await prisma.contest_history.delete({ where: { id: item.id } });
        }
      }
    }

    let createdCount = 0;
    let oldRating = 1500; // LeetCode starts at 1500
    for (const h of history) {
      const externalId = 'LC-' + h.contest.title;
      let contest = await prisma.contests.findFirst({ where: { name: h.contest.title } });
      if (!contest) {
         contest = await prisma.contests.create({
           data: {
             name: h.contest.title,
             platform: 'leetcode',
             start_time: new Date(h.contest.startTime * 1000),
             duration: 5400,
           }
         });
      }

      const existing = await prisma.contest_history.findFirst({
        where: { contest_id: contest.id, user_id: userId }
      });
      
      if (!existing) {
        await prisma.contest_history.create({
           data: {
             contest_id: contest.id,
             user_id: userId,
             old_rating: oldRating,
             new_rating: Math.round(h.rating),
             rank: h.ranking,
             date: new Date(h.contest.startTime * 1000),
             solved: 0,
             penalty: 0
           }
        });
        createdCount++;
      }
      oldRating = Math.round(h.rating);
    }
    console.log('Successfully synced ' + createdCount + ' real LC contests for ' + username);
  } catch (err) {
    console.error(err);
  }
}

syncLeetCode('5db32d9d-aead-47c0-b687-e1ec5173e346', 'sethiakshad');
