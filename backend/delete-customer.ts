import { db } from './src/db/index.js';
import { users, refreshTokens } from './src/db/schema.js';
import { eq } from 'drizzle-orm';

async function deleteCustomer() {
  console.log('🗑️ Deleting old test customer...\n');

  const email = 'testcustomer@mail.com';

  try {
    // Delete refresh tokens
    await db.delete(refreshTokens).where(
      eq(refreshTokens.userId, 
        (db.select({ id: users.id }).from(users).where(eq(users.email, email)))
      )
    );

    // Delete user
    const result = await db.delete(users).where(eq(users.email, email)).returning();

    if (result.length > 0) {
      console.log('✅ Customer deleted successfully!');
      console.log('   Email:', email);
      console.log('');
    } else {
      console.log('❌ Customer not found');
      console.log('');
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

deleteCustomer().catch(console.error);
