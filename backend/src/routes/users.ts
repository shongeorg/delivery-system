import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users, roles } from '../db/schema.js';
import { authMiddleware, allowRoles } from '../middleware/auth.js';
import { eq } from 'drizzle-orm';

const usersRouter = new Hono();

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  cover: z.string().optional(),
});

// Get current user
usersRouter.get('/me', authMiddleware, async (c) => {
  const userId = c.get('userId');
  
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!user) {
    return c.json({ error: 'User not found', code: 404 }, 404);
  }

  return c.json({
    id: user.id,
    name: user.name,
    slug: user.slug,
    email: user.email,
    role: user.role,
    cover: user.cover,
    phone: user.phone,
    address: user.address,
  });
});

// Update current user
usersRouter.patch('/me', authMiddleware, zValidator('json', updateUserSchema), async (c) => {
  const userId = c.get('userId');
  const data = c.req.valid('json');

  const [user] = await db.update(users)
    .set(data)
    .where(eq(users.id, userId))
    .returning();

  if (!user) {
    return c.json({ error: 'User not found', code: 404 }, 404);
  }

  return c.json({
    id: user.id,
    name: user.name,
    slug: user.slug,
    email: user.email,
    role: user.role,
    cover: user.cover,
    phone: user.phone,
    address: user.address,
  });
});

// Get user by slug (public)
usersRouter.get('/:slug', async (c) => {
  const slug = c.req.param('slug');

  const user = await db.query.users.findFirst({
    where: eq(users.slug, slug),
  });

  if (!user) {
    return c.json({ error: 'User not found', code: 404 }, 404);
  }

  return c.json({
    id: user.id,
    name: user.name,
    slug: user.slug,
    cover: user.cover,
    role: user.role,
  });
});

// Update user role (admin/owner only)
const updateRoleSchema = z.object({
  role: z.enum(roles),
});

usersRouter.patch('/:id/role', authMiddleware, allowRoles(['owner', 'admin']), zValidator('json', updateRoleSchema), async (c) => {
  const userId = c.req.param('id');
  const { role } = c.req.valid('json');

  const [user] = await db.update(users)
    .set({ role })
    .where(eq(users.id, userId))
    .returning();

  if (!user) {
    return c.json({ error: 'User not found', code: 404 }, 404);
  }

  return c.json({
    id: user.id,
    name: user.name,
    slug: user.slug,
    email: user.email,
    role: user.role,
  });
});

export default usersRouter;
