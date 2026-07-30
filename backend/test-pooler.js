const axios = require('axios');

const SUPABASE_URL = 'https://uuphdmszfdqkiddgjedw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6-YvgxEI9Sabj5UZYMqisA_7gA-7pv-';

async function testRestAPI() {
  console.log('Testing Supabase REST API with correct column names...\n');
  
  // Test 1: List public users (table name = "users" in public schema)
  try {
    const res = await axios.get(`${SUPABASE_URL}/rest/v1/users?select=id,email,username,role&limit=3`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      timeout: 10000,
    });
    console.log('✅ public.users query works! Status:', res.status);
    console.log('   Data:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log('❌ public.users query failed:', e.response?.status, e.response?.data || e.message);
  }

  // Test 2: Lookup specific user by email
  try {
    const res = await axios.get(`${SUPABASE_URL}/rest/v1/users?select=id,email,username,role,is_verified,is_active,created_at,avatar,bio&email=eq.akshadsethi8605@gmail.com`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      timeout: 10000,
    });
    console.log('\n✅ User lookup by email works! Status:', res.status);
    console.log('   Data:', JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.log('\n❌ User lookup failed:', e.response?.status, e.response?.data || e.message);
  }

  // Test 3: Access auth.users (requires service_role key)
  try {
    const res = await axios.get(`${SUPABASE_URL}/auth/v1/admin/users?page=1&per_page=1`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
      timeout: 10000,
    });
    console.log('\n✅ auth admin API works! Status:', res.status);
  } catch (e) {
    console.log('\n❌ auth admin API failed (expected - needs service_role key):', e.response?.status);
  }

  // Test 4: Check other tables needed
  const tables = ['daily_stats', 'leetcode_profiles', 'github_profiles', 'codeforces_profiles', 'goals', 'bookmarks'];
  for (const table of tables) {
    try {
      const res = await axios.get(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        timeout: 10000,
      });
      console.log(`✅ ${table}: accessible (${res.data.length} rows returned)`);
    } catch (e) {
      console.log(`❌ ${table}: ${e.response?.status} ${e.response?.data?.message || e.message}`);
    }
  }
}

testRestAPI().catch(console.error);
