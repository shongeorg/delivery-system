import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.POSTGRES_URL!);

async function clearProductsAndCategories() {
  console.log('Clearing products and categories...');

  await sql`DELETE FROM product_tags`;
  await sql`DELETE FROM product_categories`;
  await sql`DELETE FROM ingredients`;
  await sql`DELETE FROM products`;
  await sql`DELETE FROM tags`;
  await sql`DELETE FROM categories`;

  console.log('Done! Products and categories cleared.');
  process.exit(0);
}

clearProductsAndCategories().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
