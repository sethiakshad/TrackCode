const axios = require('axios');

async function run() {
  // Query the public table 'users'
  const url = 'https://uuphdmszfdqkiddgjedw.supabase.co/rest/v1/users?select=id';
  const key = 'sb_publishable_6-YvgxEI9Sabj5UZYMqisA_7gA-7pv-';
  
  try {
    const res = await axios.get(url, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      },
      timeout: 10000
    });
    console.log('Success! REST API responded with status:', res.status);
    console.log('REST API body:', res.data);
  } catch (err) {
    if (err.response) {
      console.log('REST API returned error status:', err.response.status);
      console.log('REST API headers:', err.response.headers);
      console.log('REST API error body:', err.response.data);
    } else {
      console.log('REST API request failed:', err.message);
    }
  }
}

run();
