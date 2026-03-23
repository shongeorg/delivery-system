import { seedProducts } from './product.seed.js';

seedProducts().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
