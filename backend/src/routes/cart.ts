import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { carts, cartItems, products } from '../db/schema.js';
import { authMiddleware } from '../middleware/auth.js';
import { eq } from 'drizzle-orm';

const cartRouter = new Hono();

const addToCartSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
});

const updateCartItemSchema = z.object({
  quantity: z.number().positive(),
});

// Get my cart
cartRouter.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId');

  let cart = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
  });

  if (!cart) {
    [cart] = await db.insert(carts).values({ userId }).returning();
    return c.json({ cart, items: [] });
  }

  const items = await db
    .select({
      item: cartItems,
      product: products,
    })
    .from(cartItems)
    .innerJoin(products, eq(cartItems.productId, products.id))
    .where(eq(cartItems.cartId, cart.id));

  return c.json({
    cart,
    items: items.map(i => ({
      ...i.item,
      product: i.product,
    })),
  });
});

// Add item to cart
cartRouter.post('/items', authMiddleware, zValidator('json', addToCartSchema), async (c) => {
  const userId = c.get('userId');
  const { productId, quantity } = c.req.valid('json');

  // Check product exists
  const product = await db.query.products.findFirst({
    where: eq(products.id, productId),
  });

  if (!product) {
    return c.json({ error: 'Product not found', code: 404 }, 404);
  }

  // Get or create cart
  let cart = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
  });

  if (!cart) {
    [cart] = await db.insert(carts).values({ userId }).returning();
  }

  // Check if item already in cart
  const existingItem = await db.query.cartItems.findFirst({
    where: eq(cartItems.productId, productId),
  });

  if (existingItem) {
    // Update quantity
    await db.update(cartItems)
      .set({ quantity: existingItem.quantity + quantity })
      .where(eq(cartItems.id, existingItem.id));
  } else {
    // Add new item
    await db.insert(cartItems).values({
      cartId: cart.id,
      productId,
      quantity,
    });
  }

  // Update cart timestamp
  await db.update(carts)
    .set({ updatedAt: new Date() })
    .where(eq(carts.id, cart.id));

  return c.json({ success: true });
});

// Update cart item quantity
cartRouter.patch('/items/:id', authMiddleware, zValidator('json', updateCartItemSchema), async (c) => {
  const itemId = c.req.param('id')!;
  const { quantity } = c.req.valid('json');

  const [item] = await db.update(cartItems)
    .set({ quantity })
    .where(eq(cartItems.id, itemId))
    .returning();

  if (!item) {
    return c.json({ error: 'Cart item not found', code: 404 }, 404);
  }

  return c.json({ success: true });
});

// Remove item from cart
cartRouter.delete('/items/:id', authMiddleware, async (c) => {
  const itemId = c.req.param('id')!;

  await db.delete(cartItems).where(eq(cartItems.id, itemId));

  return c.json({ success: true });
});

// Clear cart
cartRouter.delete('/', authMiddleware, async (c) => {
  const userId = c.get('userId');

  const cart = await db.query.carts.findFirst({
    where: eq(carts.userId, userId),
  });

  if (cart) {
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));
  }

  return c.json({ success: true });
});

export default cartRouter;
