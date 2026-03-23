// Create test order for courier app testing
const BASE_URL = 'http://localhost:3000';

async function createTestOrder() {
  console.log('🧪 Creating test order for courier app\n');

  // Step 1: Login as customer
  console.log('1️⃣ Logging in as customer...');
  const customerLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@test.com',
      password: 'admin123',
    }),
  });

  if (!customerLogin.ok) {
    console.error('❌ Failed to login as customer');
    return;
  }

  const customerData = await customerLogin.json();
  console.log('✅ Customer logged in\n');

  // Step 2: Get products
  console.log('2️⃣ Fetching products...');
  const productsRes = await fetch(`${BASE_URL}/products`);
  const productsData = await productsRes.json();
  const products = productsData.products || [];
  
  if (products.length === 0) {
    console.error('❌ No products available');
    return;
  }

  console.log(`✅ Found ${products.length} products\n`);

  // Step 3: Add items to cart
  console.log('3️⃣ Adding items to cart...');
  const addToCartRes = await fetch(`${BASE_URL}/cart/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerData.accessToken}`,
    },
    body: JSON.stringify({
      productId: products[0].id,
      quantity: 2,
    }),
  });

  if (!addToCartRes.ok) {
    console.error('❌ Failed to add to cart');
    return;
  }

  console.log('✅ Items added to cart\n');

  // Step 4: Create order
  console.log('4️⃣ Creating order...');
  const createOrderRes = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerData.accessToken}`,
    },
    body: JSON.stringify({
      deliveryType: 'delivery',
      address: 'vulytsia Myru 10, Dnipro',
      phone: '+380501234567',
      paymentType: 'card',
      items: [
        {
          productId: products[0].id,
          quantity: 2,
        },
      ],
    }),
  });

  if (!createOrderRes.ok) {
    const error = await createOrderRes.json();
    console.error('❌ Failed to create order:', error);
    return;
  }

  const order = await createOrderRes.json();
  console.log('✅ Order created successfully!\n');
  console.log('📦 Order Details:');
  console.log(`   ID: ${order.id}`);
  console.log(`   Status: ${order.status}`);
  console.log(`   Total: $${order.totalPrice}`);
  console.log(`   Address: ${order.address}`);
  console.log(`   Phone: ${order.phone}\n`);

  // Step 5: Update order status to 'ready' (simulate chef action)
  console.log('5️⃣ Simulating chef preparing order (status: paid → ready)...');
  const updateStatusRes = await fetch(`${BASE_URL}/orders/${order.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${customerData.accessToken}`,
    },
    body: JSON.stringify({
      status: 'paid',
    }),
  });

  if (updateStatusRes.ok) {
    console.log('✅ Order status updated to "paid"\n');
    
    // Now simulate chef marking as ready
    console.log('6️⃣ Simulating chef marking order as ready...');
    const markReadyRes = await fetch(`${BASE_URL}/orders/${order.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${customerData.accessToken}`,
      },
      body: JSON.stringify({
        status: 'ready',
      }),
    });

    if (markReadyRes.ok) {
      console.log('✅ Order is now READY for courier pickup!\n');
    }
  }

  console.log('🎉 Test order is ready! Courier can now see and accept it.');
  console.log('\n📱 Open courier app at: http://localhost:3033');
  console.log('🔐 Login with: cura1@mail.com / cura123');
}

createTestOrder().catch(console.error);
