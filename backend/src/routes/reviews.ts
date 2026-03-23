import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { reviews, users, products } from '../db/schema.js';
import { authMiddleware, allowRoles } from '../middleware/auth.js';
import { eq, and } from 'drizzle-orm';

const reviewsRouter = new Hono();

const createReviewSchema = z.object({
  productId: z.string(),
  rating: z.number().min(1).max(5),
  text: z.string().min(3),
});

const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  text: z.string().min(3).optional(),
});

// Get reviews for product
reviewsRouter.get('/product/:productId', async (c) => {
  const productId = c.req.param('productId')!;

  const productReviews = await db
    .select({
      review: reviews,
      user: {
        id: users.id,
        name: users.name,
        slug: users.slug,
        cover: users.cover,
      },
    })
    .from(reviews)
    .innerJoin(users, eq(reviews.userId, users.id))
    .where(eq(reviews.productId, productId))
    .orderBy(reviews.createdAt);

  return c.json(productReviews.map(r => ({
    ...r.review,
    user: r.user,
  })));
});

// Create review
reviewsRouter.post('/', authMiddleware, zValidator('json', createReviewSchema), async (c) => {
  const userId = c.get('userId');
  const { productId, rating, text } = c.req.valid('json');

  // Check if user is blocked from reviews
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (user?.isBlockedFromReviews) {
    return c.json({ error: 'You are blocked from creating reviews', code: 403 }, 403);
  }

  // Check if already reviewed
  const existingReview = await db.query.reviews.findFirst({
    where: and(
      eq(reviews.userId, userId),
      eq(reviews.productId, productId)
    ),
  });

  if (existingReview) {
    return c.json({ error: 'You have already reviewed this product', code: 400 }, 400);
  }

  const [review] = await db.insert(reviews).values({
    userId,
    productId,
    rating,
    text,
  }).returning();

  return c.json(review, 201);
});

// Update my review
reviewsRouter.patch('/:id', authMiddleware, zValidator('json', updateReviewSchema), async (c) => {
  const reviewId = c.req.param('id')!;
  const userId = c.get('userId');
  const data = c.req.valid('json');

  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, reviewId),
  });

  if (!review) {
    return c.json({ error: 'Review not found', code: 404 }, 404);
  }

  if (review.userId !== userId) {
    return c.json({ error: 'Forbidden', code: 403 }, 403);
  }

  const [updated] = await db.update(reviews)
    .set(data)
    .where(eq(reviews.id, reviewId))
    .returning();

  return c.json(updated);
});

// Delete review (owner or admin)
reviewsRouter.delete('/:id', authMiddleware, async (c) => {
  const reviewId = c.req.param('id')!;
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  const review = await db.query.reviews.findFirst({
    where: eq(reviews.id, reviewId),
  });

  if (!review) {
    return c.json({ error: 'Review not found', code: 404 }, 404);
  }

  if (review.userId !== userId && !['owner', 'admin'].includes(userRole)) {
    return c.json({ error: 'Forbidden', code: 403 }, 403);
  }

  await db.delete(reviews).where(eq(reviews.id, reviewId));

  return c.json({ success: true });
});

export default reviewsRouter;
