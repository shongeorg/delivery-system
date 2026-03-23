import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { categories, products, productCategories } from '../db/schema.js';
import { authMiddleware, allowRoles } from '../middleware/auth.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { eq, inArray } from 'drizzle-orm';

const categoriesRouter = new Hono();

const createCategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  cover: z.string().optional(),
});

// Get all categories (public)
categoriesRouter.get('/', async (c) => {
  const allCategories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });
  return c.json(allCategories);
});

// Get category by slug with paginated products (public)
categoriesRouter.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '25');
  const offset = (page - 1) * limit;

  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });

  if (!category) {
    return c.json({ error: 'Category not found', code: 404 }, 404);
  }

  // Get all product IDs for this category
  const allCategoryProducts = await db
    .select({
      productId: products.id,
    })
    .from(products)
    .innerJoin(productCategories, eq(products.id, productCategories.productId))
    .where(eq(productCategories.categoryId, category.id));

  const total = allCategoryProducts.length;
  const lastPage = Math.ceil(total / limit);

  // Get paginated products
  const productIds = allCategoryProducts.map(p => p.productId);
  const paginatedProductIds = productIds.slice(offset, offset + limit);

  const categoryProducts = await db
    .select({
      product: products,
    })
    .from(products)
    .where(inArray(products.id, paginatedProductIds));

  return c.json({
    category,
    products: categoryProducts.map(p => p.product),
    pagination: {
      page,
      limit,
      total,
      lastPage,
    },
  });
});

// Create category (admin/owner only)
categoriesRouter.post('/', authMiddleware, allowRoles(['owner', 'admin']), zValidator('json', createCategorySchema), async (c) => {
  const { name, description, cover } = c.req.valid('json');

  const existingSlugs = await db.select({ slug: categories.slug }).from(categories);
  const slug = generateUniqueSlug(name, existingSlugs.map(c => c.slug));

  const [category] = await db.insert(categories).values({
    name,
    slug,
    description,
    cover,
  }).returning();

  return c.json(category, 201);
});

// Update category (admin/owner only)
categoriesRouter.patch('/:id', authMiddleware, allowRoles(['owner', 'admin']), zValidator('json', createCategorySchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [category] = await db.update(categories)
    .set(data)
    .where(eq(categories.id, id))
    .returning();

  if (!category) {
    return c.json({ error: 'Category not found', code: 404 }, 404);
  }

  return c.json(category);
});

// Delete category (admin/owner only)
categoriesRouter.delete('/:id', authMiddleware, allowRoles(['owner', 'admin']), async (c) => {
  const id = c.req.param('id')!;

  await db.delete(categories).where(eq(categories.id, id));

  return c.json({ success: true });
});

export default categoriesRouter;
