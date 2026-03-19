const axios = require('axios');

async function verifyLeads() {
  const baseUrl = 'http://localhost:3000/api/leads';
  
  console.log('--- Testing POST /api/leads ---');
  try {
    const postRes = await axios.post(baseUrl, {
      name: 'Test Lead',
      email: 'test@example.com',
      phone: '1234567890',
      password: 'password123',
      plan: 'Premium',
      pincode: '560001'
    });
    console.log('POST Status:', postRes.status);
    console.log('POST Data:', JSON.stringify(postRes.data, null, 2));
  } catch (err) {
    console.log('POST Error:', err.response ? err.response.data : err.message);
  }

  console.log('\n--- Testing GET /api/leads ---');
  try {
    const getRes = await axios.get(baseUrl);
    console.log('GET Status:', getRes.status);
    console.log('GET Data Count:', getRes.data.data ? getRes.data.data.length : 'N/A');
    if (getRes.data.data && getRes.data.data.length > 0) {
      console.log('First Lead Name:', getRes.data.data[0].name);
    }
  } catch (err) {
    console.log('GET Error:', err.response ? err.response.data : err.message);
  }
}

// verifyLeads();
console.log('Verification script created. Note: Ensure the dev server is running.');
