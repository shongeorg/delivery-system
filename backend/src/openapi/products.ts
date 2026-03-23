import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { db } from '../db/index.js';
import { products, categories, tags, productCategories, productTags, ingredients } from '../db/schema.js';
import { authMiddleware, allowRoles } from '../middleware/auth.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { eq } from 'drizzle-orm';

export const productsOpenAPI = new OpenAPIHono();

const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.string(),
  description: z.string().nullable(),
  cover: z.string().nullable(),
  createdAt: z.any(),
  createdBy: z.string().nullable(),
});

// Get all products
const getProductsRoute = createRoute({
  method: 'get',
  path: '/',
  responses: {
    200: {
      description: 'List of products',
      content: {
        'application/json': {
          schema: z.array(ProductSchema),
        },
      },
    },
  },
  tags: ['Products'],
});

productsOpenAPI.openapi(getProductsRoute, async (c) => {
  const allProducts = await db.query.products.findMany({
    orderBy: (products, { desc }) => [desc(products.createdAt)],
  });
  return c.json(allProducts);
});

// Get product by slug
const getProductRoute = createRoute({
  method: 'get',
  path: '/:slug',
  request: {
    params: z.object({
      slug: z.string(),
    }),
  },
  responses: {
    200: {
      description: 'Product details',
      content: {
        'application/json': {
          schema: ProductSchema.extend({
            categories: z.array(z.any()),
            tags: z.array(z.any()),
            ingredients: z.array(z.any()),
          }),
        },
      },
    },
    404: {
      description: 'Product not found',
    },
  },
  tags: ['Products'],
});

productsOpenAPI.openapi(getProductRoute, async (c) => {
  const slug = c.req.param('slug');
  
  const product = await db.query.products.findFirst({
    where: eq(products.slug, slug),
  });

  if (!product) {
    return c.json({ error: 'Product not found', code: 404 }, 404);
  }

  const productCats = await db
    .select({ category: categories })
    .from(categories)
    .innerJoin(productCategories, eq(categories.id, productCategories.categoryId))
    .where(eq(productCategories.productId, product.id));

  const productTagsList = await db
    .select({ tag: tags })
    .from(tags)
    .innerJoin(productTags, eq(tags.id, productTags.tagId))
    .where(eq(productTags.productId, product.id));

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

// Create product
const createProductRoute = createRoute({
  method: 'post',
  path: '/',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(2),
            price: z.number().positive(),
            description: z.string().optional(),
            cover: z.string().optional(),
            categoryIds: z.array(z.string()).optional(),
            tagIds: z.array(z.string()).optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'Product created',
      content: {
        'application/json': {
          schema: ProductSchema,
        },
      },
    },
  },
  tags: ['Products'],
});

productsOpenAPI.use('/', authMiddleware);
productsOpenAPI.use('/', allowRoles(['owner', 'admin']));
productsOpenAPI.openapi(createProductRoute, async (c) => {
  const userId = c.get('userId');
  const { name, price, description, cover, categoryIds, tagIds } = c.req.valid('json');

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

  if (categoryIds && categoryIds.length > 0) {
    await db.insert(productCategories).values(
      categoryIds.map(categoryId => ({ productId: product.id, categoryId }))
    );
  }

  if (tagIds && tagIds.length > 0) {
    await db.insert(productTags).values(
      tagIds.map(tagId => ({ productId: product.id, tagId }))
    );
  }

  return c.json(product, 201);
});
