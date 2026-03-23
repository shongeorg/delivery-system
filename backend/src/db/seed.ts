import { db } from './index.js';
import { users, categories, products, tags, ingredients, inventory } from './schema.js';
import { hashPassword } from '../utils/auth.js';
import { generateSlug } from '../utils/slug.js';

async function seed() {
  console.log('🌱 Seeding database...');

  // Create owner
  const ownerPassword = hashPassword('owner123');
  const [owner] = await db.insert(users).values({
    name: 'Owner',
    slug: 'owner',
    email: 'owner@test.com',
    passwordHash: ownerPassword,
    role: 'owner',
    phone: '+1234567890',
  }).onConflictDoNothing().returning();

  if (owner) {
    console.log('✅ Owner created:', owner.email);
  }

  // Create admin
  const adminPassword = hashPassword('admin123');
  const [admin] = await db.insert(users).values({
    name: 'Admin',
    slug: 'admin',
    email: 'admin@test.com',
    passwordHash: adminPassword,
    role: 'admin',
    phone: '+1234567891',
  }).onConflictDoNothing().returning();

  if (admin) {
    console.log('✅ Admin created:', admin.email);
  }

  // Create categories (10 categories)
  const categoryData = [
    { name: 'Pizza', description: 'Traditional Italian pizzas with fresh ingredients', cover: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500' },
    { name: 'Burgers', description: 'Juicy beef burgers with premium toppings', cover: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
    { name: 'Sushi', description: 'Fresh Japanese sushi and rolls', cover: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500' },
    { name: 'Salads', description: 'Healthy and fresh salad options', cover: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500' },
    { name: 'Pasta', description: 'Authentic Italian pasta dishes', cover: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=500' },
    { name: 'Desserts', description: 'Sweet treats and delicious desserts', cover: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500' },
    { name: 'Drinks', description: 'Refreshing beverages and soft drinks', cover: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500' },
    { name: 'Asian', description: 'Traditional Asian cuisine dishes', cover: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500' },
    { name: 'Mexican', description: 'Spicy and flavorful Mexican food', cover: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500' },
    { name: 'Breakfast', description: 'Start your day with delicious breakfast', cover: 'https://images.unsplash.com/photo-1533089862017-5614ec45e25a?w=500' },
  ];

  const createdCategories = [];
  for (const cat of categoryData) {
    const [category] = await db.insert(categories).values({
      ...cat,
      slug: generateSlug(cat.name),
    }).onConflictDoNothing().returning();
    if (category) {
      createdCategories.push(category);
      console.log('✅ Category created:', category.name);
    }
  }

  // Create tags
  const tagData = ['Spicy', 'Vegetarian', 'Vegan', 'Gluten-Free', 'Popular', 'New', 'Hot', 'Chef Special'];
  const createdTags = [];
  for (const tagName of tagData) {
    const [tag] = await db.insert(tags).values({
      name: tagName,
      slug: generateSlug(tagName),
    }).onConflictDoNothing().returning();
    if (tag) {
      createdTags.push(tag);
      console.log('✅ Tag created:', tag.name);
    }
  }

  // Create products
  const productData = [
    {
      name: 'Margherita Pizza',
      price: '12.99',
      description: 'Classic tomato sauce, mozzarella, and basil',
      cover: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500',
      category: 'Pizza',
      tags: ['Vegetarian', 'Popular'],
      ingredients: [
        { name: 'Tomato Sauce', quantity: '150', unit: 'ml' },
        { name: 'Mozzarella', quantity: '200', unit: 'g' },
        { name: 'Basil', quantity: '10', unit: 'g' },
      ],
    },
    {
      name: 'Pepperoni Pizza',
      price: '14.99',
      description: 'Tomato sauce, mozzarella, and pepperoni',
      cover: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500',
      category: 'Pizza',
      tags: ['Spicy', 'Popular'],
      ingredients: [
        { name: 'Tomato Sauce', quantity: '150', unit: 'ml' },
        { name: 'Mozzarella', quantity: '200', unit: 'g' },
        { name: 'Pepperoni', quantity: '100', unit: 'g' },
      ],
    },
    {
      name: 'Classic Burger',
      price: '10.99',
      description: 'Beef patty, lettuce, tomato, cheese, and special sauce',
      cover: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
      category: 'Burgers',
      tags: ['Popular', 'Hot'],
      ingredients: [
        { name: 'Beef Patty', quantity: '200', unit: 'g' },
        { name: 'Bun', quantity: '1', unit: 'pc' },
        { name: 'Cheese', quantity: '50', unit: 'g' },
        { name: 'Lettuce', quantity: '30', unit: 'g' },
      ],
    },
    {
      name: 'California Roll',
      price: '8.99',
      description: 'Crab, avocado, and cucumber roll',
      cover: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=500',
      category: 'Sushi',
      tags: ['Popular'],
      ingredients: [
        { name: 'Rice', quantity: '150', unit: 'g' },
        { name: 'Crab', quantity: '80', unit: 'g' },
        { name: 'Avocado', quantity: '50', unit: 'g' },
        { name: 'Cucumber', quantity: '30', unit: 'g' },
      ],
    },
    {
      name: 'Caesar Salad',
      price: '9.99',
      description: 'Romaine lettuce, croutons, parmesan, and Caesar dressing',
      cover: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500',
      category: 'Salads',
      tags: ['Vegetarian'],
      ingredients: [
        { name: 'Romaine Lettuce', quantity: '200', unit: 'g' },
        { name: 'Croutons', quantity: '50', unit: 'g' },
        { name: 'Parmesan', quantity: '30', unit: 'g' },
      ],
    },
    {
      name: 'Chocolate Cake',
      price: '6.99',
      description: 'Rich chocolate layer cake',
      cover: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500',
      category: 'Desserts',
      tags: ['Popular', 'Chef Special'],
      ingredients: [
        { name: 'Chocolate', quantity: '200', unit: 'g' },
        { name: 'Flour', quantity: '150', unit: 'g' },
        { name: 'Sugar', quantity: '100', unit: 'g' },
      ],
    },
  ];

  for (const prod of productData) {
    const category = createdCategories.find(c => c.name === prod.category);
    if (!category) continue;

    const [product] = await db.insert(products).values({
      name: prod.name,
      slug: generateSlug(prod.name),
      price: prod.price,
      description: prod.description,
      cover: prod.cover,
      createdBy: owner?.id,
    }).onConflictDoNothing().returning();

    if (product) {
      console.log('✅ Product created:', product.name);

      // Add ingredients
      for (const ing of prod.ingredients) {
        await db.insert(ingredients).values({
          productId: product.id,
          name: ing.name,
          quantity: ing.quantity,
          unit: ing.unit,
        });
      }
    }
  }

  // Create inventory items
  const inventoryData = [
    { name: 'Tomato Sauce', quantity: '50', unit: 'L', cover: 'https://images.unsplash.com/photo-1592417817098-8fd3d9eb14a5?w=500' },
    { name: 'Mozzarella', quantity: '100', unit: 'kg', cover: 'https://images.unsplash.com/photo-1624806992066-5ffcf7ca1840?w=500' },
    { name: 'Beef Patty', quantity: '200', unit: 'kg', cover: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500' },
    { name: 'Rice', quantity: '500', unit: 'kg', cover: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500' },
    { name: 'Lettuce', quantity: '100', unit: 'kg', cover: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=500' },
  ];

  for (const inv of inventoryData) {
    const [item] = await db.insert(inventory).values({
      name: inv.name,
      slug: generateSlug(inv.name),
      quantity: inv.quantity,
      unit: inv.unit,
      cover: inv.cover,
    }).onConflictDoNothing().returning();

    if (item) {
      console.log('✅ Inventory created:', item.name);
    }
  }

  console.log('✨ Seeding completed!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
