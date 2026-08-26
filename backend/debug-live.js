/**
 * Debug script — run via dotenvx to get proper env loading
 * Usage: node -r dotenv/config debug-live.js
 */
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('Key prefix:', SERVICE_KEY ? SERVICE_KEY.substring(0, 20) : 'NOT SET');
console.log('Key type:', SERVICE_KEY && SERVICE_KEY.startsWith('sb_secret') ? 'SERVICE ROLE ✓' : 'ANON ✗');

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const TEST_USER_ID = '5db32d9d-aead-47c0-b687-e1ec5173e346';

async function runDebug() {
  // 1. Check leetcode_profiles
  const { data: lcData, error: lcErr } = await supabase
    .from('leetcode_profiles')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .maybeSingle();
  
  console.log('\n--- 1. LEETCODE_PROFILES ---');
  console.log('Data:', JSON.stringify(lcData, null, 2));
  if (lcErr) console.log('Error:', lcErr.message);

  // 2. Check dashboard_summary
  const { data: dashData, error: dashErr } = await supabase
    .from('dashboard_summary')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .maybeSingle();
  
  console.log('\n--- 2. DASHBOARD_SUMMARY ---');
  console.log('Data:', JSON.stringify(dashData, null, 2));
  if (dashErr) console.log('Error:', dashErr.message);

  // 3. Count daily_stats
  const { data: dailyData, error: dailyErr } = await supabase
    .from('daily_stats')
    .select('date, problems_solved')
    .eq('user_id', TEST_USER_ID)
    .order('date', { ascending: false })
    .limit(10);
  
  console.log('\n--- 3. DAILY_STATS (last 10) ---');
  console.log('Data:', JSON.stringify(dailyData, null, 2));
  if (dailyErr) console.log('Error:', dailyErr.message);

  // 4. Test INSERT to leetcode_profiles
  console.log('\n--- 4. TESTING INSERT ---');
  const { data: insertData, error: insertErr } = await supabase
    .from('leetcode_profiles')
    .insert({
      user_id: TEST_USER_ID,
      username: '__debug_test__',
      problems_solved: 0,
      easy: 0,
      medium: 0,
      hard: 0,
    })
    .select('*')
    .single();
  
  if (insertErr) {
    console.log('INSERT Error:', insertErr.message);
  } else {
    console.log('INSERT Success:', insertData);
    // Clean up test insert
    await supabase.from('leetcode_profiles').delete().eq('user_id', TEST_USER_ID);
    console.log('Cleaned up test insert.');
  }
}

runDebug();
