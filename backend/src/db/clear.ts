import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.POSTGRES_URL!);

async function clearData() {
  console.log('Clearing database tables...');

  // Delete in correct order (foreign keys)
  console.log('Deleting from inventory...');
  await sql`DELETE FROM inventory`;

  console.log('Deleting from messages...');
  await sql`DELETE FROM messages`;

  console.log('Deleting from chats...');
  await sql`DELETE FROM chats`;

  console.log('Deleting from cart_items...');
  await sql`DELETE FROM cart_items`;

  console.log('Deleting from carts...');
  await sql`DELETE FROM carts`;

  console.log('Deleting from reviews...');
  await sql`DELETE FROM reviews`;

  console.log('Deleting from order_items...');
  await sql`DELETE FROM order_items`;

  console.log('Deleting from orders...');
  await sql`DELETE FROM orders`;

  console.log('Deleting from product_tags...');
  await sql`DELETE FROM product_tags`;

  console.log('Deleting from product_categories...');
  await sql`DELETE FROM product_categories`;

  console.log('Deleting from ingredients...');
  await sql`DELETE FROM ingredients`;

  console.log('Deleting from tags...');
  await sql`DELETE FROM tags`;

  console.log('Deleting from products...');
  await sql`DELETE FROM products`;

  console.log('Deleting from categories...');
  await sql`DELETE FROM categories`;

  console.log('Deleting from refresh_tokens...');
  await sql`DELETE FROM refresh_tokens`;

  console.log('Deleting from users (except owner/admin)...');
  await sql`DELETE FROM users WHERE role NOT IN ('owner', 'admin')`;

  console.log('Done! Tables cleared.');
  process.exit(0);
}

clearData().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
