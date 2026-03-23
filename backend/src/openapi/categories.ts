import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { db } from '../db/index.js';
import { categories, products, productCategories } from '../db/schema.js';
import { authMiddleware, allowRoles } from '../middleware/auth.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { eq } from 'drizzle-orm';

export const categoriesOpenAPI = new OpenAPIHono();

const CategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  cover: z.string().nullable(),
});

// Get all categories
const getCategoriesRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'List of categories',
      content: {
        'application/json': {
          schema: z.array(CategorySchema),
        },
      },
    },
  },
  tags: ['Categories'],
});

categoriesOpenAPI.openapi(getCategoriesRoute, async (c) => {
  const allCategories = await db.query.categories.findMany({
    orderBy: (categories, { asc }) => [asc(categories.name)],
  });
  return c.json(allCategories);
});

// Get category by slug
const getCategoryRoute = createRoute({
  method: 'get',
  path: '/:slug',
  request: {
    params: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Category with products',
      content: {
        'application/json': {
          schema: CategorySchema.extend({
            products: z.array(z.any()),
          }),
        },
      },
    },
    404: {
      description: 'Category not found',
    },
  },
  tags: ['Categories'],
});

categoriesOpenAPI.openapi(getCategoryRoute, async (c) => {
  const slug = c.req.param('slug');
  
  const category = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
  });

  if (!category) {
    return c.json({ error: 'Category not found', code: 404 }, 404);
  }

  const categoryProducts = await db
    .select({
      product: products,
    })
    .from(products)
    .innerJoin(productCategories, eq(products.id, productCategories.productId))
    .where(eq(productCategories.categoryId, category.id));

  return c.json({
    ...category,
    products: categoryProducts.map(p => p.product),
  });
});
