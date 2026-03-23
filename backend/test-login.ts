import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testLogin() {
  console.log('🔐 Testing customer login...\n');

  try {
    const res = await axios.post(`${API_URL}/auth/login`, {
      email: 'testcustomer@mail.com',
      password: 'test123'
    });

    console.log('✅ Login successful!');
    console.log('   Access Token:', res.data.access_token?.slice(0, 50) + '...');
    console.log('   User:', res.data.user?.name);
    console.log('   Role:', res.data.user?.role);
    console.log('');
  } catch (error: any) {
    console.error('❌ Login failed:', error.response?.data);
    console.log('');
    
    // Try to debug - check if user exists
    console.log('Debugging info:');
    console.log('   Email: testcustomer@mail.com');
    console.log('   Password: test123');
    console.log('   API URL:', API_URL);
    console.log('');
  }
}

testLogin().catch(console.error);
