/**
 * Debug script to check which key the Supabase client is using
 * and test RLS bypass.
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uuphdmszfdqkiddgjedw.supabase.co';
const ANON_KEY = process.env.SUPABASE_KEY;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- KEY CHECK ---');
console.log('SUPABASE_URL:', SUPABASE_URL);
console.log('SUPABASE_KEY (first 20 chars):', ANON_KEY ? ANON_KEY.substring(0, 20) : 'NOT SET');
console.log('SUPABASE_SERVICE_ROLE_KEY (first 20 chars):', SERVICE_KEY ? SERVICE_KEY.substring(0, 20) : 'NOT SET');
console.log('Are they the same?', ANON_KEY === SERVICE_KEY);

// The prisma.js uses:
const ACTUAL_KEY_USED = SERVICE_KEY || ANON_KEY || 'sb_publishable_6-YvgxEI9Sabj5UZYMqisA_7gA-7pv-';
console.log('\nKey actually used by prisma.js (first 20 chars):', ACTUAL_KEY_USED.substring(0, 20));
console.log('Key type (sb_secret = service role, sb_publishable = anon):', ACTUAL_KEY_USED.startsWith('sb_secret') ? 'SERVICE ROLE ✓' : 'ANON/PUBLISHABLE ✗');

// Now test with SERVICE ROLE key explicitly
const TEST_USER_ID = '5db32d9d-aead-47c0-b687-e1ec5173e346';

async function testWithServiceKey() {
  if (!SERVICE_KEY) {
    console.log('\nNo service role key found. This is the root cause!');
    return;
  }

  const client = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client
    .from('leetcode_profiles')
    .select('*')
    .eq('user_id', TEST_USER_ID)
    .maybeSingle();

  console.log('\nDirect service-key SELECT result:', data, error?.message);
}

testWithServiceKey();
