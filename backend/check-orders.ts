import { db } from './src/db/index.js';
import { orders } from './src/db/schema.js';

async function checkOrders() {
  console.log('📊 Checking order statuses...\n');

  const allOrders = await db.select().from(orders);
  
  console.log(`Total orders: ${allOrders.length}\n`);
  
  // Group by status
  const byStatus = {};
  allOrders.forEach(order => {
    byStatus[order.status] = (byStatus[order.status] || 0) + 1;
  });
  
  console.log('Orders by status:');
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`   - ${status}: ${count}`);
  });
  
  console.log('\n💡 Courier sees only "ready" orders!');
  console.log('   Need to update orders from "created" → "ready"\n');
}

checkOrders().catch(console.error);
