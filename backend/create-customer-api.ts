import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function createCustomer() {
  console.log('👤 Creating customer account...\n');

  try {
    const res = await axios.post(`${API_URL}/auth/register`, {
      email: 'customer@test.com',
      password: 'cust123',
      name: 'Test Customer',
      phone: '+380501234567',
      address: 'vulytsia Myru 10, Dnipro'
    });

    console.log('✅ Customer created successfully!');
    console.log('   Email:', res.data.user.email);
    console.log('   Name:', res.data.user.name);
    console.log('   Access Token:', res.data.accessToken?.slice(0, 50) + '...');
    console.log('');
  } catch (error: any) {
    console.error('❌ Registration failed:', error.response?.data);
    console.log('');
  }
}

createCustomer().catch(console.error);
