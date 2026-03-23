import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { tags, products, productTags } from '../db/schema.js';
import { authMiddleware, allowRoles } from '../middleware/auth.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { eq } from 'drizzle-orm';

const tagsRouter = new Hono();

const createTagSchema = z.object({
  name: z.string().min(2),
});

// Get all tags (public)
tagsRouter.get('/', async (c) => {
  const allTags = await db.query.tags.findMany({
    orderBy: (tags, { asc }) => [asc(tags.name)],
  });
  return c.json(allTags);
});

// Get tag by slug with products (public)
tagsRouter.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  
  const tag = await db.query.tags.findFirst({
    where: eq(tags.slug, slug),
  });

  if (!tag) {
    return c.json({ error: 'Tag not found', code: 404 }, 404);
  }

  const tagProducts = await db
    .select({
      product: products,
    })
    .from(products)
    .innerJoin(productTags, eq(products.id, productTags.productId))
    .where(eq(productTags.tagId, tag.id));

  return c.json({
    ...tag,
    products: tagProducts.map(p => p.product),
  });
});

// Create tag (admin/owner only)
tagsRouter.post('/', authMiddleware, allowRoles(['owner', 'admin']), zValidator('json', createTagSchema), async (c) => {
  const { name } = c.req.valid('json');

  const existingSlugs = await db.select({ slug: tags.slug }).from(tags);
  const slug = generateUniqueSlug(name, existingSlugs.map(t => t.slug));

  const [tag] = await db.insert(tags).values({
    name,
    slug,
  }).returning();

  return c.json(tag, 201);
});

// Delete tag (admin/owner only)
tagsRouter.delete('/:id', authMiddleware, allowRoles(['owner', 'admin']), async (c) => {
  const id = c.req.param('id')!;

  await db.delete(tags).where(eq(tags.id, id));

  return c.json({ success: true });
});

export default tagsRouter;
