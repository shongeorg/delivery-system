import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { db } from '../db/index.js';
import { users, refreshTokens } from '../db/schema.js';
import { hashPassword, comparePassword, generateAccessToken, generateRefreshToken } from '../utils/auth.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { eq } from 'drizzle-orm';

export const authOpenAPI = new OpenAPIHono();

// Register route
const registerRoute = createRoute({
  method: 'post',
  path: '/register',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            name: z.string().min(2),
            email: z.string().email(),
            password: z.string().min(6),
            phone: z.string().optional(),
            address: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      description: 'User registered successfully',
      content: {
        'application/json': {
          schema: z.object({
            user: z.object({
              id: z.string(),
              name: z.string(),
              slug: z.string(),
              email: z.string(),
              role: z.string(),
            }),
            accessToken: z.string(),
            refreshToken: z.string(),
          }),
        },
      },
    },
    400: {
      description: 'Email already exists',
    },
  },
  tags: ['Auth'],
});

authOpenAPI.openapi(registerRoute, async (c) => {
  const { name, email, password, phone, address } = c.req.valid('json');

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return c.json({ error: 'Email already exists', code: 400 }, 400);
  }

  const existingSlugs = await db.select({ slug: users.slug }).from(users);
  const slug = generateUniqueSlug(name, existingSlugs.map(u => u.slug));
  const passwordHash = hashPassword(password);

  const [user] = await db.insert(users).values({
    name,
    slug,
    email,
    passwordHash,
    role: 'customer',
    phone,
    address,
  }).returning();

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id });

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

// Login route
const loginRoute = createRoute({
  method: 'post',
  path: '/login',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            email: z.string().email(),
            password: z.string(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Login successful',
      content: {
        'application/json': {
          schema: z.object({
            user: z.object({
              id: z.string(),
              name: z.string(),
              slug: z.string(),
              email: z.string(),
              role: z.string(),
            }),
            accessToken: z.string(),
            refreshToken: z.string(),
          }),
        },
      },
    },
    401: {
      description: 'Invalid credentials',
    },
  },
  tags: ['Auth'],
});

authOpenAPI.openapi(loginRoute, async (c) => {
  const { email, password } = c.req.valid('json');

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user || !comparePassword(password, user.passwordHash)) {
    return c.json({ error: 'Invalid credentials', code: 401 }, 401);
  }

  const accessToken = generateAccessToken({ userId: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ userId: user.id });

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
