import axios from 'axios';

const API_URL = 'http://localhost:3000';

async function testGetProducts() {
  console.log('📦 Testing get products...\n');

  try {
    const res = await axios.get(`${API_URL}/products`);
    console.log('✅ Products fetched successfully!');
    console.log(`   Count: ${res.data.length}`);
    console.log('   First product:', JSON.stringify(res.data[0], null, 2));
    console.log('');
  } catch (error: any) {
    console.error('❌ Failed to fetch products:', error.response?.data || error.message);
    console.log('');
  }
}

testGetProducts().catch(console.error);
