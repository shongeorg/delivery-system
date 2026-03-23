import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function createCustomer() {
  console.log('👤 Creating test customer account...\n');

  try {
    // Try to login first
    console.log('Checking if customer exists...');
    await axios.post(`${API_URL}/auth/login`, {
      email: 'testcustomer@mail.com',
      password: 'test123'
    });
    console.log('✅ Customer already exists\n');
    return true;
  } catch (error: any) {
    if (error.response?.status === 401) {
      console.log('❌ Customer does not exist. Creating...\n');
      
      try {
        const res = await axios.post(`${API_URL}/auth/register`, {
          email: 'testcustomer@mail.com',
          password: 'test123',
          name: 'Test Customer',
          phone: '+380501234567',
          address: 'vulytsia Myru 10, Dnipro'
        });
        
        console.log('✅ Customer created successfully!');
        console.log(`   ID: ${res.data.id}`);
        console.log(`   Email: ${res.data.email}`);
        console.log(`   Name: ${res.data.name}`);
        console.log('');
        return true;
      } catch (createError: any) {
        console.error('❌ Failed to create customer:', createError.response?.data || createError.message);
        return false;
      }
    } else {
      console.error('❌ Unexpected error:', error);
      return false;
    }
  }
}

createCustomer().catch(console.error);
