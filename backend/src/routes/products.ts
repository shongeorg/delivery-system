import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { products, categories, tags, productCategories, productTags, ingredients } from '../db/schema.js';
import { authMiddleware, allowRoles } from '../middleware/auth.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { eq, inArray } from 'drizzle-orm';

const productsRouter = new Hono();

const createProductSchema = z.object({
  name: z.string().min(2),
  price: z.number().positive(),
  description: z.string().optional(),
  cover: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  tagIds: z.array(z.string()).optional(),
  ingredients: z.array(z.object({
    name: z.string(),
    quantity: z.number().positive(),
    unit: z.string(),
  })).optional(),
});

// Get all products with pagination (public)
productsRouter.get('/', async (c) => {
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '25');
  const offset = (page - 1) * limit;

  // Get total count
  const allProducts = await db.query.products.findMany();
  const total = allProducts.length;
  const lastPage = Math.ceil(total / limit);

  // Get paginated products
  const paginatedProducts = await db.query.products.findMany({
    orderBy: (products, { desc }) => [desc(products.createdAt)],
    limit,
    offset,
  });

  return c.json({
    products: paginatedProducts,
    pagination: {
      page,
      limit,
      total,
      lastPage,
    },
  });
});

// Get product by slug (public)
productsRouter.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
  });

  if (!product) {
    return c.json({ error: 'Product not found', code: 404 }, 404);
  }

  // Get categories
  const productCats = await db
    .select({ category: categories })
    .from(categories)
    .innerJoin(productCategories, eq(categories.id, productCategories.categoryId))
    .where(eq(productCategories.productId, product.id));

  // Get tags
  const productTagsList = await db
    .select({ tag: tags })
    .from(tags)
    .innerJoin(productTags, eq(tags.id, productTags.tagId))
    .where(eq(productTags.productId, product.id));

  // Get ingredients
  const productIngredients = await db
    .select()
    .from(ingredients)
    .where(eq(ingredients.productId, product.id));

  return c.json({
    ...product,
    categories: productCats.map(c => c.category),
    tags: productTagsList.map(t => t.tag),
    ingredients: productIngredients,
  });
});

// Create product (admin/owner only)
productsRouter.post('/', authMiddleware, allowRoles(['owner', 'admin']), zValidator('json', createProductSchema), async (c) => {
  const userId = c.get('userId');
  const { name, price, description, cover, categoryIds, tagIds, ingredients: productIngredientsList } = c.req.valid('json');

  const existingSlugs = await db.select({ slug: products.slug }).from(products);
  const slug = generateUniqueSlug(name, existingSlugs.map(p => p.slug));

  const [product] = await db.insert(products).values({
    name,
    slug,
    price: price.toString(),
    description,
    cover,
    createdBy: userId,
  }).returning();

  // Add categories
  if (categoryIds && categoryIds.length > 0) {
    await db.insert(productCategories).values(
      categoryIds.map(categoryId => ({ productId: product.id, categoryId }))
    );
  }

  // Add tags
  if (tagIds && tagIds.length > 0) {
    await db.insert(productTags).values(
      tagIds.map(tagId => ({ productId: product.id, tagId }))
    );
  }

  // Add ingredients
  if (productIngredientsList && productIngredientsList.length > 0) {
    await db.insert(ingredients).values(
      productIngredientsList.map(ing => ({
        productId: product.id,
        name: ing.name,
        quantity: ing.quantity.toString(),
        unit: ing.unit,
      }))
    );
  }

  return c.json(product, 201);
});

// Update product (admin/owner only)
productsRouter.patch('/:id', authMiddleware, allowRoles(['owner', 'admin']), zValidator('json', createProductSchema.partial()), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');

  const [product] = await db.update(products)
    .set({
      ...data,
      price: data.price?.toString(),
    })
    .where(eq(products.id, id))
    .returning();

  if (!product) {
    return c.json({ error: 'Product not found', code: 404 }, 404);
  }

  return c.json(product);
});

// Delete product (admin/owner only)
productsRouter.delete('/:id', authMiddleware, allowRoles(['owner', 'admin']), async (c) => {
  const id = c.req.param('id')!;

  await db.delete(products).where(eq(products.id, id));

  return c.json({ success: true });
});

export default productsRouter;
