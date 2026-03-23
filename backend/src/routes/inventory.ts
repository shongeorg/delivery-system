import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { inventory } from '../db/schema.js';
import { authMiddleware, allowRoles } from '../middleware/auth.js';
import { generateUniqueSlug } from '../utils/slug.js';
import { eq } from 'drizzle-orm';

const inventoryRouter = new Hono();

const createInventorySchema = z.object({
  name: z.string().min(2),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  cover: z.string().optional(),
});

const updateQuantitySchema = z.object({
  quantity: z.number().positive(),
});

// Get all inventory (admin/owner/chef)
inventoryRouter.get('/', authMiddleware, allowRoles(['owner', 'admin', 'chef']), async (c) => {
  const allInventory = await db.query.inventory.findMany({
    orderBy: (inventory, { asc }) => [asc(inventory.name)],
  });
  return c.json(allInventory);
});

// Get inventory by slug
inventoryRouter.get('/:slug', authMiddleware, allowRoles(['owner', 'admin', 'chef']), async (c) => {
  const slug = c.req.param('slug')!;
  
  const item = await db.query.inventory.findFirst({
    where: eq(inventory.slug, slug),
  });

  if (!item) {
    return c.json({ error: 'Inventory item not found', code: 404 }, 404);
  }

  return c.json(item);
});

// Create inventory item (admin/owner)
inventoryRouter.post('/', authMiddleware, allowRoles(['owner', 'admin']), zValidator('json', createInventorySchema), async (c) => {
  const { name, quantity, unit, cover } = c.req.valid('json');

  const existingSlugs = await db.select({ slug: inventory.slug }).from(inventory);
  const slug = generateUniqueSlug(name, existingSlugs.map(i => i.slug));

  const [item] = await db.insert(inventory).values({
    name,
    slug,
    quantity: quantity.toString(),
    unit,
    cover,
  }).returning();

  return c.json(item, 201);
});

// Update inventory quantity
inventoryRouter.patch('/:id/quantity', authMiddleware, allowRoles(['owner', 'admin', 'chef']), zValidator('json', updateQuantitySchema), async (c) => {
  const id = c.req.param('id')!;
  const { quantity } = c.req.valid('json');

  const [item] = await db.update(inventory)
    .set({ 
      quantity: quantity.toString(),
      updatedAt: new Date(),
    })
    .where(eq(inventory.id, id))
    .returning();

  if (!item) {
    return c.json({ error: 'Inventory item not found', code: 404 }, 404);
  }

  return c.json(item);
});

// Delete inventory item (admin/owner)
inventoryRouter.delete('/:id', authMiddleware, allowRoles(['owner', 'admin']), async (c) => {
  const id = c.req.param('id')!;

  await db.delete(inventory).where(eq(inventory.id, id));

  return c.json({ success: true });
});

export default inventoryRouter;
