import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { orders, orderItems, products, carts, cartItems } from '../db/schema.js';
import { authMiddleware, allowRoles } from '../middleware/auth.js';
import { eq, inArray } from 'drizzle-orm';

const ordersRouter = new Hono();

const orderStatus = ['created', 'paid', 'cooking', 'ready', 'on_the_way', 'delivered', 'cancelled'] as const;
const deliveryType = ['pickup', 'delivery'] as const;
const paymentType = ['card', 'cash'] as const;
const paymentStatus = ['pending', 'paid', 'failed', 'refunded'] as const;

const createOrderSchema = z.object({
  deliveryType: z.enum(deliveryType),
  address: z.string().optional(),
  phone: z.string(),
  paymentType: z.enum(paymentType),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
  })).min(1),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatus),
});

// Get all orders (admin/owner/chef/courier)
ordersRouter.get('/', authMiddleware, allowRoles(['owner', 'admin', 'chef', 'courier']), async (c) => {
  const allOrders = await db.query.orders.findMany({
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });
  return c.json(allOrders);
});

// Get my orders
ordersRouter.get('/my', authMiddleware, async (c) => {
  const userId = c.get('userId');
  
  const myOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });
  return c.json(myOrders);
});

// Get order by id
ordersRouter.get('/:id', authMiddleware, async (c) => {
  const id = c.req.param('id')!;
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
  });

  if (!order) {
    return c.json({ error: 'Order not found', code: 404 }, 404);
  }

  // Check access
  if (order.userId !== userId && !['owner', 'admin', 'chef', 'courier'].includes(userRole)) {
    return c.json({ error: 'Forbidden', code: 403 }, 403);
  }

  const items = await db
    .select({
      item: orderItems,
      product: products,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(eq(orderItems.orderId, id));

  return c.json({
    ...order,
    items: items.map(i => ({
      ...i.item,
      product: i.product,
    })),
  });
});

// Create order from cart
ordersRouter.post('/', authMiddleware, zValidator('json', createOrderSchema), async (c) => {
  const userId = c.get('userId');
  const { deliveryType, address, phone, paymentType, items } = c.req.valid('json');

  // Get products
  const productIds = items.map(i => i.productId);
  const productsList = await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));

  if (productsList.length !== productIds.length) {
    return c.json({ error: 'Some products not found', code: 400 }, 400);
  }

  // Calculate total
  let totalPrice = 0;
  const orderItemsData = items.map(item => {
    const product = productsList.find(p => p.id === item.productId)!;
    const price = parseFloat(product.price);
    totalPrice += price * item.quantity;
    return {
      productId: item.productId,
      quantity: item.quantity,
      price: price.toString(),
    };
  });

  // Create order
  const [order] = await db.insert(orders).values({
    userId,
    totalPrice: totalPrice.toString(),
    status: 'created',
    deliveryType,
    address,
    phone,
    paymentType,
    paymentStatus: 'pending',
  }).returning();

  // Create order items
  await db.insert(orderItems).values(
    orderItemsData.map(item => ({
      ...item,
      orderId: order.id,
    }))
  );

  // Clear cart if exists
  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
  });
  if (cart) {
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  }

  return c.json(order, 201);
});

// Update order status (admin/owner/chef/courier)
ordersRouter.patch('/:id/status', authMiddleware, allowRoles(['owner', 'admin', 'chef', 'courier']), zValidator('json', updateOrderStatusSchema), async (c) => {
  const id = c.req.param('id')!;
  const { status } = c.req.valid('json');

  const [order] = await db.update(orders)
    .set({ status })
    .where(eq(orders.id, id))
    .returning();

  if (!order) {
    return c.json({ error: 'Order not found', code: 404 }, 404);
  }

  return c.json(order);
});

// Cancel order (customer - only if created)
ordersRouter.post('/:id/cancel', authMiddleware, async (c) => {
  const id = c.req.param('id')!;
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  const order = await db.query.orders.findFirst({
    where: eq(orders.id, id),
  });

  if (!order) {
    return c.json({ error: 'Order not found', code: 404 }, 404);
  }

  // Only owner or admin can cancel
  if (order.userId !== userId && !['owner', 'admin'].includes(userRole)) {
    return c.json({ error: 'Forbidden', code: 403 }, 403);
  }

  // Only cancel if status is 'created' or 'paid'
  if (!['created', 'paid'].includes(order.status)) {
    return c.json({ error: 'Cannot cancel order at this stage', code: 400 }, 400);
  }

  const [updated] = await db.update(orders)
    .set({ status: 'cancelled' })
    .where(eq(orders.id, id))
    .returning();

  return c.json(updated);
});

export default ordersRouter;
