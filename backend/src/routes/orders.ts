import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { orders, orderItems, products, carts, cartItems, users, courierLocations } from '../db/schema.js';
import { authMiddleware, allowRoles } from '../middleware/auth.js';
import { broadcast, broadcastToChannel, orderChannel } from '../websocket.js';
import { saveCourierLocation } from '../services/tracking.js';
import { eq, inArray } from 'drizzle-orm';

const ordersRouter = new Hono();

async function enrichOrders(orderList: (typeof orders.$inferSelect)[]) {
  if (orderList.length === 0) return [];

  const orderIds = orderList.map(order => order.id);
  const userIds = [...new Set(orderList.map(order => order.userId).filter((id): id is string => Boolean(id)))];
  const courierIds = [...new Set(orderList.map(order => order.courierId).filter((id): id is string => Boolean(id)))];
  const peopleIds = [...new Set([...userIds, ...courierIds])];

  const itemRows = await db
    .select({
      item: orderItems,
      product: products,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(inArray(orderItems.orderId, orderIds));

  const peopleRows = peopleIds.length > 0
    ? await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          phone: users.phone,
        })
        .from(users)
        .where(inArray(users.id, peopleIds))
    : [];

  return orderList.map(order => ({
    ...order,
    items: itemRows
      .filter(row => row.item.orderId === order.id)
      .map(row => ({ ...row.item, product: row.product })),
    user: peopleRows.find(user => user.id === order.userId) ?? null,
    courier: peopleRows.find(user => user.id === order.courierId) ?? null,
  }));
}

const orderStatus = ['created', 'paid', 'cooking', 'ready', 'on_the_way', 'delivered', 'cancelled'] as const;
const deliveryType = ['pickup', 'delivery'] as const;
const paymentType = ['card', 'cash'] as const;
const paymentStatus = ['pending', 'paid', 'failed', 'refunded'] as const;

const createOrderSchema = z.object({
  deliveryType: z.enum(deliveryType),
  address: z.string().optional(),
  phone: z.string(),
  paymentType: z.enum(paymentType),
  lat: z.number().optional(),
  lng: z.number().optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
  })).min(1),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(orderStatus),
});

const locationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const allowedTransitions: Record<string, string[]> = {
  created: ['paid', 'cooking', 'cancelled'],
  paid: ['cooking', 'cancelled'],
  cooking: ['ready', 'cancelled'],
  ready: ['on_the_way', 'cancelled'],
  on_the_way: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

// Get all orders (admin/owner/chef/courier)
ordersRouter.get('/', authMiddleware, allowRoles(['owner', 'admin', 'chef', 'courier']), async (c) => {
  const status = c.req.query('status');
  const allOrders = status
    ? await db.query.orders.findMany({
        where: eq(orders.status, status),
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      })
    : await db.query.orders.findMany({
        orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      });

  return c.json(await enrichOrders(allOrders));
});

// Get my orders
ordersRouter.get('/my', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const myOrders = await db.query.orders.findMany({
    where: eq(orders.userId, userId),
    orderBy: (orders, { desc }) => [desc(orders.createdAt)],
  });

  return c.json(await enrichOrders(myOrders));
});

async function loadOrderWithPeople(id: string) {
  const [enriched] = await enrichOrders(
    await db.query.orders.findMany({ where: eq(orders.id, id) })
  );
  return enriched ?? null;
}

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

// Track an order (customer, courier, staff)
ordersRouter.get('/:id/tracking', authMiddleware, async (c) => {
  const id = c.req.param('id')!;
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  const order = await loadOrderWithPeople(id);

  if (!order) {
    return c.json({ error: 'Order not found', code: 404 }, 404);
  }

  if (order.userId !== userId && order.courierId !== userId && !['owner', 'admin', 'chef'].includes(userRole)) {
    return c.json({ error: 'Forbidden', code: 403 }, 403);
  }

  const location = order.courierId
    ? await db.query.courierLocations.findFirst({
        where: eq(courierLocations.courierId, order.courierId),
      })
    : null;

  return c.json({
    order: {
      id: order.id,
      status: order.status,
      deliveryType: order.deliveryType,
      address: order.address,
      phone: order.phone,
      totalPrice: order.totalPrice,
      paymentType: order.paymentType,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      items: order.items,
    },
    client: {
      lat: order.lat ? Number(order.lat) : null,
      lng: order.lng ? Number(order.lng) : null,
    },
    courier: order.courier
      ? {
          id: order.courier.id,
          name: order.courier.name,
          phone: order.courier.phone,
        }
      : null,
    location: location
      ? {
          lat: Number(location.lat),
          lng: Number(location.lng),
          updatedAt: location.updatedAt,
        }
      : null,
  });
});

// Create order from cart
ordersRouter.post('/', authMiddleware, zValidator('json', createOrderSchema), async (c) => {
  const userId = c.get('userId');
  const { deliveryType, address, phone, paymentType, lat, lng, items } = c.req.valid('json');

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
    lat: typeof lat === 'number' ? lat.toString() : null,
    lng: typeof lng === 'number' ? lng.toString() : null,
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

  broadcast('new_order', order);

  return c.json(order, 201);
});

// Update order status (admin/owner/chef/courier)
ordersRouter.patch('/:id/status', authMiddleware, allowRoles(['owner', 'admin', 'chef', 'courier']), zValidator('json', updateOrderStatusSchema), async (c) => {
  const id = c.req.param('id')!;
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const { status } = c.req.valid('json');

  const current = await db.query.orders.findFirst({
    where: eq(orders.id, id),
  });

  if (!current) {
    return c.json({ error: 'Order not found', code: 404 }, 404);
  }

  const transitions = allowedTransitions[current.status] ?? [];

  if (!transitions.includes(status)) {
    return c.json({ error: `Cannot change status from ${current.status} to ${status}`, code: 409 }, 409);
  }

  if (userRole === 'courier') {
    if (!['on_the_way', 'delivered'].includes(status)) {
      return c.json({ error: 'Couriers can only accept and complete deliveries', code: 403 }, 403);
    }
    if (status === 'on_the_way' && current.courierId && current.courierId !== userId) {
      return c.json({ error: 'Order already accepted by another courier', code: 409 }, 409);
    }
    if (current.courierId && current.courierId !== userId) {
      return c.json({ error: 'Order is assigned to another courier', code: 403 }, 403);
    }
  }

  const nextCourierId = status === 'on_the_way' && userRole === 'courier'
    ? userId
    : current.courierId;

  const [order] = await db.update(orders)
    .set({ status, courierId: nextCourierId })
    .where(eq(orders.id, id))
    .returning();

  broadcastToChannel(orderChannel(order.id), 'order_updated', order);
  broadcast('order_updated', order);

  return c.json(order);
});

// Share courier location over HTTP (fallback for the WebSocket)
ordersRouter.put('/:id/location', authMiddleware, allowRoles(['courier']), zValidator('json', locationSchema), async (c) => {
  const id = c.req.param('id')!;
  const userId = c.get('userId');
  const { lat, lng } = c.req.valid('json');

  const result = await saveCourierLocation(id, userId, lat, lng);

  if (!result.ok) {
    return c.json({ error: result.error, code: result.code }, result.code as 400);
  }

  const payload = {
    orderId: result.orderId,
    courierId: result.courierId,
    lat: result.lat,
    lng: result.lng,
    updatedAt: result.updatedAt,
  };

  broadcastToChannel(orderChannel(result.orderId), 'courier_location', payload);

  return c.json(payload);
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

  broadcast('order_cancelled', updated);

  return c.json(updated);
});

export default ordersRouter;
