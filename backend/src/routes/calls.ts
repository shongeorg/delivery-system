import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { orders } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { isSupportOnline, isUserOnline } from '../websocket.js';

const callsRouter = new Hono();

callsRouter.get('/presence', authMiddleware, async (c) => {
  const orderId = c.req.query('orderId');
  const userId = c.get('userId');
  const role = c.get('userRole');

  if (!orderId) {
    return c.json({ supportOnline: isSupportOnline() });
  }

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
    columns: { userId: true, courierId: true },
  });

  if (!order) {
    return c.json({ error: 'Order not found', code: 404 }, 404);
  }

  if (order.userId !== userId && order.courierId !== userId && !['owner', 'admin', 'chef'].includes(role)) {
    return c.json({ error: 'Forbidden', code: 403 }, 403);
  }

  return c.json({
    supportOnline: isSupportOnline(),
    customerOnline: order.userId ? isUserOnline(order.userId) : false,
    courierOnline: order.courierId ? isUserOnline(order.courierId) : false,
  });
});

export default callsRouter;
