import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { users, refreshTokens, roles } from '../db/schema.js';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken } from '../utils/auth.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { eq } from 'drizzle-orm';

const authRouter = new Hono();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// Register
authRouter.post('/register', zValidator('json', registerSchema), async (c) => {
  const { name, email, password, phone, address } = c.req.valid('json');

  // Check if email exists
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return c.json({ error: 'Email already exists', code: 400 }, 400);
  }

  // Generate unique slug
  const existingSlugs = await db.select({ slug: users.slug }).from(users);
  const slug = generateUniqueSlug(name, existingSlugs.map(u => u.slug));

  // Hash password
  const passwordHash = hashPassword(password);

  // Create user
  const [user] = await db.insert(users).values({
    name,
    slug,
    email,
    passwordHash,
    role: 'customer',
    phone,
    address,
  }).returning();

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id });

  // Save refresh token
  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return c.json({
    user: {
      id: user.id,
      name: user.name,
      slug: user.slug,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  }, 201);
});

// Login
authRouter.post('/login', zValidator('json', loginSchema), async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !comparePassword(password, user.passwordHash)) {
    return c.json({ error: 'Invalid credentials', code: 401 }, 401);
  }

  // Generate tokens
  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id });

  // Save refresh token
  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return c.json({
    user: {
      id: user.id,
      name: user.name,
      slug: user.slug,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
  });
});

// Refresh token
authRouter.post('/refresh', async (c) => {
  const { refreshToken } = await c.req.json();

  if (!refreshToken) {
    return c.json({ error: 'Refresh token required', code: 400 }, 400);
  }

  // Find token in DB
  const tokenRecord = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.token, refreshToken),
  });

  if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
    return c.json({ error: 'Invalid refresh token', code: 401 }, 401);
  }

  // Get user
  const user = await db.query.users.findFirst({
    where: eq(users.id, tokenRecord.userId!),
  });

  if (!user) {
    return c.json({ error: 'User not found', code: 404 }, 404);
  }

  // Generate new tokens
  const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
  const newRefreshToken = generateRefreshToken({ userId: user.id });

  // Delete old token and save new one
  await db.delete(refreshTokens).where(eq(refreshTokens.id, tokenRecord.id));
  await db.insert(refreshTokens).values({
    userId: user.id,
    token: newRefreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return c.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  });
});

export default authRouter;
