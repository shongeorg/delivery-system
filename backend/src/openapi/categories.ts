import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { db } from '../db/index.js';
import { categories, products, productCategories } from '../db/schema.js';
import { authMiddleware, allowRoles } from '../middleware/auth.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { eq, inArray } from 'drizzle-orm';

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

// Get category by slug with pagination - slug as query param for UI compatibility
const getCategoryRoute = createRoute({
  method: 'get',
  path: '/get',
  request: {
    query: z.object({
      slug: z.string(),
      page: z.string().optional().default('1'),
      limit: z.string().optional().default('25'),
    }),
  },
  responses: {
    200: {
      description: 'Category with paginated products',
      content: {
        'application/json': {
          schema: z.object({
            category: CategorySchema,
            products: z.array(z.any()),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              lastPage: z.number(),
            }),
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
  const slug = c.req.query('slug');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '25');
  const offset = (page - 1) * limit;

  if (!slug) {
    return c.json({ error: 'Slug query parameter required', code: 400 }, 400);
  }

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

// Alternative endpoint using query param for slug (for UIs that don't support path params)
const getCategoryByQueryRoute = createRoute({
  method: 'get',
  path: '/by-slug',
  request: {
    query: z.object({
      slug: z.string(),
      page: z.string().optional().default('1'),
      limit: z.string().optional().default('25'),
    }),
  },
  responses: {
    200: {
      description: 'Category with paginated products',
      content: {
        'application/json': {
          schema: z.object({
            category: CategorySchema,
            products: z.array(z.any()),
            pagination: z.object({
              page: z.number(),
              limit: z.number(),
              total: z.number(),
              lastPage: z.number(),
            }),
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

categoriesOpenAPI.openapi(getCategoryByQueryRoute, async (c) => {
  const slug = c.req.query('slug');
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
