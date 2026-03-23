import { db } from './src/db/index.js';
import { users, orders, orderItems, products as productsSchema } from './src/db/schema.js';
import { hashPassword } from './src/utils/auth.js';
import { eq } from 'drizzle-orm';

const CUSTOMER_EMAIL = 'bulkcustomer@test.com';
const CUSTOMER_PASSWORD = 'bulk123';

async function createBulkOrders() {
  console.log('🛒 Starting bulk order creation...\n');

  // Step 1: Create or get customer
  console.log('📝 Getting customer account...');
  let existingUser = await db.query.users.findFirst({
    where: eq(users.email, CUSTOMER_EMAIL),
  });

  if (!existingUser) {
    console.log('   Creating new customer...');
    const passwordHash = hashPassword(CUSTOMER_PASSWORD);
    const [newUser] = await db.insert(users).values({
      name: 'Bulk Customer',
      email: CUSTOMER_EMAIL,
      passwordHash,
      phone: '+380501234567',
      address: 'vulytsia Myru 10, Dnipro',
      role: 'customer',
      slug: `bulk-customer-${Date.now()}`
    }).returning();
    existingUser = newUser;
    console.log('   ✅ Customer created:', existingUser.email);
  } else {
    console.log('   ✅ Customer exists:', existingUser.email);
  }
  console.log('');

  // Step 2: Get all products
  console.log('📦 Fetching products...');
  const allProducts = await db.select().from(productsSchema);
  console.log(`   ✅ Found ${allProducts.length} products\n`);

  // Step 3: Create 50 orders
  const totalOrders = 50;
  const successfulOrders = [];

  console.log(`🚀 Creating ${totalOrders} orders...\n`);

  for (let i = 0; i < totalOrders; i++) {
    console.log(`--- Order #${i + 1}/${totalOrders} ---`);

    // Random number of items (1-5)
    const numItems = Math.floor(Math.random() * 5) + 1;
    let totalPrice = 0;
    const createdItems = [];

    for (let j = 0; j < numItems; j++) {
      // Pick random product
      const randomProduct = allProducts[Math.floor(Math.random() * allProducts.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      const price = parseFloat(randomProduct.price);
      
      createdItems.push({
        productId: randomProduct.id,
        quantity,
        price: randomProduct.price
      });
      
      totalPrice += price * quantity;
      console.log(`   - x${quantity} ${randomProduct.name} ($${price})`);
    }

    // Random delivery type
    const deliveryTypes = ['delivery', 'pickup'];
    const deliveryType = deliveryTypes[Math.floor(Math.random() * deliveryTypes.length)];
    
    // Different addresses
    const addresses = [
      'vulytsia Myru 10, Dnipro',
      'prospekt Serhiia Nigoyana 5, Dnipro',
      'vulytsia Sichovykh Striltsiv 20, Dnipro',
      'naberezhna Peremohy 15, Dnipro',
      'vulytsia Volodymyra Velychkoho 8, Dnipro'
    ];
    const address = addresses[Math.floor(Math.random() * addresses.length)];

    try {
      // Create order
      const [createdOrder] = await db.insert(orders).values({
        userId: existingUser.id!,
        status: 'created',
        deliveryType,
        address,
        phone: '+380501234567',
        paymentType: 'card',
        paymentStatus: 'pending',
        totalPrice: totalPrice.toFixed(2),
      }).returning();

      console.log(`   ✅ Order created: ${createdOrder.id.slice(-8)}`);
      console.log(`   Status: ${createdOrder.status}`);
      console.log(`   Total: $${createdOrder.totalPrice}`);

      // Create order items
      for (const item of createdItems) {
        await db.insert(orderItems).values({
          orderId: createdOrder.id!,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price
        });
      }

      // Update status to paid
      await db.update(orders).set({ 
        status: 'paid',
        paymentStatus: 'paid',
      }).where(eq(orders.id, createdOrder.id!));

      console.log(`   ✅ Payment completed - status updated to 'paid'`);
      
      successfulOrders.push(createdOrder);
    } catch (error: any) {
      console.error(`   ❌ Failed: ${error.message}`);
    }

    console.log(''); // Empty line
  }

  console.log('\n=================================');
  console.log(`🎉 Bulk order creation complete!`);
  console.log(`✅ Successfully created and paid: ${successfulOrders.length}/${totalOrders} orders`);
  console.log('=================================\n');

  // Summary by status
  const statusCount = {};
  successfulOrders.forEach(order => {
    statusCount[order.status] = (statusCount[order.status] || 0) + 1;
  });

  console.log('📊 Orders by status:');
  Object.entries(statusCount).forEach(([status, count]) => {
    console.log(`   - ${status}: ${count}`);
  });
  
  console.log('\n💡 Login credentials:');
  console.log(`   Email: ${CUSTOMER_EMAIL}`);
  console.log(`   Password: ${CUSTOMER_PASSWORD}`);
  console.log('');
}

createBulkOrders().catch(console.error);
