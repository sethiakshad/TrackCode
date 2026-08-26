/**
 * This script tests the upsert operation to leetcode_profiles directly
 * to see if the Supabase REST API is actually writing data.
 */
const prisma = require('./src/config/prisma');

const TEST_USER_ID = '5db32d9d-aead-47c0-b687-e1ec5173e346'; // akshadsethi123@gmail.com

async function testUpsert() {
  console.log('[1] Checking current leetcode_profiles for user...');
  const before = await prisma.leetcode_profiles.findUnique({ where: { user_id: TEST_USER_ID } });
  console.log('BEFORE:', JSON.stringify(before, null, 2));

  console.log('\n[2] Attempting upsert with test data...');
  try {
    const result = await prisma.leetcode_profiles.upsert({
      where: { user_id: TEST_USER_ID },
      update: {
        username: 'testuser',
        problems_solved: 123,
        easy: 50,
        medium: 60,
        hard: 13,
        synced_at: new Date(),
      },
      create: {
        user_id: TEST_USER_ID,
        username: 'testuser',
        problems_solved: 123,
        easy: 50,
        medium: 60,
        hard: 13,
        synced_at: new Date(),
      },
    });
    console.log('UPSERT RESULT:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('UPSERT FAILED:', err.message);
  }

  console.log('\n[3] Checking after upsert...');
  const after = await prisma.leetcode_profiles.findUnique({ where: { user_id: TEST_USER_ID } });
  console.log('AFTER:', JSON.stringify(after, null, 2));
}

testUpsert();
