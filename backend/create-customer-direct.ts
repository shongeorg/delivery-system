import { db } from './src/db/index.js';
import { users, roles } from './src/db/schema.js';
import { hashPassword } from './src/utils/auth.js';
import { eq } from 'drizzle-orm';

async function createCustomer() {
  console.log('👤 Creating test customer directly via Drizzle...\n');

  const email = 'testcustomer@mail.com';
  const password = 'test123';
  const name = 'Test Customer';
  const phone = '+380501234567';
  const address = 'vulytsia Myru 10, Dnipro';

  try {
    // Check if exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      console.log('✅ Customer already exists:', existingUser.email);
      return;
    }

    // Create user
    const passwordHash = hashPassword(password);
    
    const [user] = await db.insert(users).values({
      name,
      email,
      passwordHash,
      phone,
      address,
      role: 'customer',
      slug: `test-customer-${Date.now()}`
    }).returning();

    console.log('✅ Customer created successfully!');
    console.log('   ID:', user.id);
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  }
}

createCustomer().catch(console.error);
