const prisma = require('./src/config/prisma.js');

async function main() {
  const users = await prisma.public_users.findMany();
  for (const user of users) {
    const historyCount = await prisma.contest_history.count({ where: { user_id: user.id } });
    if (historyCount === 0) {
      console.log(`Seeding contests for user ${user.id}`);
      
      const c1 = await prisma.contests.create({ data: { platform: 'leetcode', name: 'Weekly Contest 300', start_time: new Date('2023-01-01'), duration: 90 } });
      const c2 = await prisma.contests.create({ data: { platform: 'leetcode', name: 'Weekly Contest 305', start_time: new Date('2023-02-01'), duration: 90 } });
      const c3 = await prisma.contests.create({ data: { platform: 'codeforces', name: 'Codeforces Round 800', start_time: new Date('2023-03-01'), duration: 120 } });
      const c4 = await prisma.contests.create({ data: { platform: 'codeforces', name: 'Codeforces Round 810', start_time: new Date('2023-04-01'), duration: 120 } });

      await prisma.contest_history.create({ data: { contest_id: c1.id, user_id: user.id, rank: 1500, old_rating: 1500, new_rating: 1550, solved: 3, date: new Date('2023-01-01') } });
      await prisma.contest_history.create({ data: { contest_id: c2.id, user_id: user.id, rank: 1200, old_rating: 1550, new_rating: 1620, solved: 4, date: new Date('2023-02-01') } });
      await prisma.contest_history.create({ data: { contest_id: c3.id, user_id: user.id, rank: 3000, old_rating: 1400, new_rating: 1450, solved: 2, date: new Date('2023-03-01') } });
      await prisma.contest_history.create({ data: { contest_id: c4.id, user_id: user.id, rank: 1500, old_rating: 1450, new_rating: 1580, solved: 4, date: new Date('2023-04-01') } });
      
      console.log(`Done seeding for user ${user.id}`);
    }
  }
}
main().catch(console.error);
