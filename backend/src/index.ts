import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import dotenv from 'dotenv';
import type { Server } from 'http';

import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import categoriesRouter from './routes/categories.js';
import productsRouter from './routes/products.js';
import ordersRouter from './routes/orders.js';
import cartRouter from './routes/cart.js';
import reviewsRouter from './routes/reviews.js';
import tagsRouter from './routes/tags.js';
import inventoryRouter from './routes/inventory.js';
import chatsRouter from './routes/chats.js';
import paymentsRouter from './routes/payments.js';
import { setupWebSocket } from './websocket.js';

// OpenAPI routes
import { openAPIApp } from './openapi/index.js';

dotenv.config();

const app = new Hono();

// Middleware
app.use(cors());
app.use(logger());

// API Routes
app.route('/auth', authRouter);
app.route('/users', usersRouter);
app.route('/categories', categoriesRouter);
app.route('/products', productsRouter);
app.route('/orders', ordersRouter);
app.route('/cart', cartRouter);
app.route('/reviews', reviewsRouter);
app.route('/tags', tagsRouter);
app.route('/inventory', inventoryRouter);
app.route('/chats', chatsRouter);
app.route('/payments', paymentsRouter);

// OpenAPI Routes (for docs)
app.route('/api', openAPIApp);

// Health check
app.get('/health', (c) => c.json({ status: 'ok' }));

// Error handler
app.onError((err, c) => {
  console.error(err);
  return c.json({ error: 'Internal server error', code: 500 }, 500);
});

// 404 handler
app.notFound((c) => c.json({ error: 'Not found', code: 404 }, 404));

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 Server starting on port ${port}...`);

const server = serve({
  fetch: app.fetch,
  port,
}) as Server;

// Setup WebSocket
setupWebSocket(server);

export default app;
