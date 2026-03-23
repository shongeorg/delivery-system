import { db } from './src/db/index.js';
import { orders } from './src/db/schema.js';

async function setAllOrdersReady() {
  console.log('🍳 Setting all orders to READY status for courier...\n');

  const result = await db.update(orders)
    .set({ 
      status: 'ready',
      paymentStatus: 'paid'
    });

  console.log(`✅ Updated ${result.rowCount} orders to 'ready' status`);
  console.log('💡 Now courier can see ALL these orders!\n');
}

setAllOrdersReady().catch(console.error);
