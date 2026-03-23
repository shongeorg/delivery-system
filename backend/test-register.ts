import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testRegister() {
  console.log('🔐 Testing customer registration...\n');

  const email = `testcustomer${Date.now()}@mail.com`;
  
  try {
    const res = await axios.post(`${API_URL}/auth/register`, {
      email,
      password: 'test123',
      name: 'Test Customer',
      phone: '+380501234567',
      address: 'vulytsia Myru 10, Dnipro'
    });

    console.log('✅ Registration successful!');
    console.log('   Status:', res.status);
    console.log('   Data:', JSON.stringify(res.data, null, 2));
    console.log('');
  } catch (error: any) {
    console.error('❌ Registration failed:', error.response?.data);
    console.log('');
  }
}

testRegister().catch(console.error);
