import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import Stripe from 'stripe';
import { db } from '../db/index.js';
import { orders, orderItems, products } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { eq, inArray } from 'drizzle-orm';
import { broadcastToUser } from '../websocket.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const paymentsRouter = new Hono();

const createPaymentIntentSchema = z.object({
  orderId: z.string(),
});

// Create payment intent
paymentsRouter.post('/create-intent', authMiddleware, zValidator('json', createPaymentIntentSchema), async (c) => {
  const userId = c.get('userId');
  const { orderId } = c.req.valid('json');

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    return c.json({ error: 'Order not found', code: 404 }, 404);
  }

  if (order.userId !== userId) {
    return c.json({ error: 'Forbidden', code: 403 }, 403);
  }

  if (order.paymentStatus === 'paid') {
    return c.json({ error: 'Order already paid', code: 400 }, 400);
  }

  const amount = Math.round(parseFloat(order.totalPrice) * 100); // Convert to cents

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'usd',
    metadata: {
      orderId: order.id,
      userId: order.userId,
    },
  });

  return c.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
});

// Webhook for Stripe events
paymentsRouter.post('/webhook', async (c) => {
  const payload = await c.req.text();
  const signature = c.req.header('stripe-signature') || '';

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return c.json({ error: `Webhook Error: ${err.message}` }, 400);
  }

  // Handle events
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        // Update order status
        const [order] = await db.update(orders)
          .set({ 
            paymentStatus: 'paid',
            status: 'paid',
          })
          .where(eq(orders.id, orderId))
          .returning();

        if (order) {
          broadcastToUser(order.userId!, 'order_updated', order);
        }
      }
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderId = paymentIntent.metadata.orderId;

      if (orderId) {
        await db.update(orders)
          .set({ paymentStatus: 'failed' })
          .where(eq(orders.id, orderId));
      }
      break;
    }
  }

  return c.json({ received: true });
});

export default paymentsRouter;
