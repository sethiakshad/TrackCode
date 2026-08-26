const prisma = require('./src/config/prisma');

async function listUsers() {
  const users = await prisma.public_users.findMany();
  console.log('All Users:');
  for (const u of users) {
    const lc = await prisma.leetcode_profiles.findUnique({ where: { user_id: u.id } });
    console.log(`- ${u.email} (ID: ${u.id}) -> LC Username: ${lc ? lc.username : 'None'}`);
  }
}
listUsers();
