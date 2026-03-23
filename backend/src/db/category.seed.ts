import { db } from './index.js';
import { categories } from './schema.js';
import { generateUniqueSlug } from '../utils/slug.js';

export async function seedCategories() {
  console.log('Seeding categories...');

  const existingCategories = await db.select({ slug: categories.slug }).from(categories);
  const existingSlugs = existingCategories.map(c => c.slug);

  const categoriesData = [
    {
      name: 'Pizza',
      description: 'Traditional Italian pizzas with fresh ingredients',
      cover: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500',
    },
    {
      name: 'Burgers',
      description: 'Juicy beef burgers with premium toppings',
      cover: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
    },
    {
      name: 'Sushi',
      description: 'Fresh Japanese sushi and rolls',
      cover: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500',
    },
    {
      name: 'Salads',
      description: 'Healthy and fresh salad options',
      cover: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500',
    },
    {
      name: 'Pasta',
      description: 'Authentic Italian pasta dishes',
      cover: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=500',
    },
    {
      name: 'Desserts',
      description: 'Sweet treats and delicious desserts',
      cover: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500',
    },
    {
      name: 'Drinks',
      description: 'Refreshing beverages and soft drinks',
      cover: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500',
    },
    {
      name: 'Asian',
      description: 'Traditional Asian cuisine dishes',
      cover: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500',
    },
    {
      name: 'Mexican',
      description: 'Spicy and flavorful Mexican food',
      cover: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500',
    },
    {
      name: 'Breakfast',
      description: 'Start your day with delicious breakfast',
      cover: 'https://images.unsplash.com/photo-1533089862017-5614ec45e25a?w=500',
    },
  ];

  const insertedCategories = [];

  for (const category of categoriesData) {
    const slug = generateUniqueSlug(category.name, existingSlugs);
    existingSlugs.push(slug);

    const [inserted] = await db.insert(categories).values({
      name: category.name,
      slug,
      description: category.description,
      cover: category.cover,
    }).returning();

    insertedCategories.push(inserted);
    console.log(`  ✓ Added category: ${category.name} (${slug})`);
  }

  console.log(`Total categories seeded: ${insertedCategories.length}`);
  return insertedCategories;
}
