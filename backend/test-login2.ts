import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testLogin() {
  console.log('🔐 Testing login...\n');

  try {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: 'customer@test.com',
      password: 'cust123'
    });

    console.log('✅ Login successful!');
    console.log('   Access Token:', res.data.accessToken?.slice(0, 50) + '...');
    console.log('   User:', res.data.user?.name);
    console.log('   Role:', res.data.user?.role);
    console.log('');
    
    return res.data.accessToken;
  } catch (error: any) {
    console.error('❌ Login failed:', error.response?.data);
    console.log('');
    return null;
  }
}

testLogin().catch(console.error);
