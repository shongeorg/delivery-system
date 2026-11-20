import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { chats, messages, orders } from '../db/schema.js';
import { authMiddleware, allowRoles } from '../middleware/auth.js';
import { broadcastToChannel, orderChannel } from '../websocket.js';
import { eq } from 'drizzle-orm';

const chatsRouter = new Hono();

const sendMessageSchema = z.object({
  text: z.string().min(1),
});

// Get my chats
chatsRouter.get('/', authMiddleware, async (c) => {
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  let userChats;
  
  if (['owner', 'admin'].includes(userRole)) {
    // Admin/owner sees all chats
    userChats = await db.query.chats.findMany({
      orderBy: (chats, { desc }) => [desc(chats.id)],
    });
  } else {
    // User sees only their chats
    userChats = await db.query.chats.findMany({
      where: eq(chats.userId, userId),
      orderBy: (chats, { desc }) => [desc(chats.id)],
    });
  }

  return c.json(userChats);
});

// Get or create chat
chatsRouter.post('/', authMiddleware, async (c) => {
  const userId = c.get('userId');

  let chat = await db.query.chats.findFirst({
    where: eq(chats.userId, userId),
  });

  if (!chat) {
    [chat] = await db.insert(chats).values({ userId }).returning();
  }

  return c.json(chat);
});

// Get chat messages
chatsRouter.get('/:id/messages', authMiddleware, async (c) => {
  const chatId = c.req.param('id')!;
  const userId = c.get('userId');
  const userRole = c.get('userRole');

  const chat = await db.query.chats.findFirst({
    where: eq(chats.id, chatId),
  });

  if (!chat) {
    return c.json({ error: 'Chat not found', code: 404 }, 404);
  }

  // Check access
  if (chat.userId !== userId && !['owner', 'admin'].includes(userRole)) {
    return c.json({ error: 'Forbidden', code: 403 }, 403);
  }

  const chatMessages = await db
    .select({
      id: messages.id,
      sender: messages.sender,
      text: messages.text,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(messages.createdAt);

  return c.json(chatMessages);
});

// Send message
chatsRouter.post('/:id/messages', authMiddleware, zValidator('json', sendMessageSchema), async (c) => {
  const chatId = c.req.param('id')!;
  const userId = c.get('userId');
  const userRole = c.get('userRole');
  const { text } = c.req.valid('json');

  const chat = await db.query.chats.findFirst({
    where: eq(chats.id, chatId),
  });

  if (!chat) {
    return c.json({ error: 'Chat not found', code: 404 }, 404);
  }

  // Determine sender
  let sender = 'user';
  if (chat.userId === userId) {
    sender = 'user';
  } else if (['owner', 'admin'].includes(userRole)) {
    sender = 'admin';
  } else {
    return c.json({ error: 'Forbidden', code: 403 }, 403);
  }

  const [message] = await db.insert(messages).values({
    chatId,
    sender,
    text,
  }).returning();

  return c.json(message, 201);
});

async function loadOrderChat(orderId: string) {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    return { error: 'Order not found', code: 404 as const };
  }

  let chat = await db.query.chats.findFirst({
    where: eq(chats.orderId, orderId),
  });

  if (!chat) {
    [chat] = await db.insert(chats).values({
      userId: order.userId,
      orderId,
    }).returning();
  }

  return { order, chat };
}

function resolveSender(
  order: { userId: string | null; courierId: string | null },
  userId: string,
  role: string
) {
  if (role === 'courier' && order.courierId === userId) return 'courier';
  if (['owner', 'admin'].includes(role)) return 'admin';
  if (order.userId === userId) return 'user';
  return null;
}

chatsRouter.get('/order/:orderId', authMiddleware, async (c) => {
  const orderId = c.req.param('orderId')!;
  const userId = c.get('userId');
  const role = c.get('userRole');
  const loaded = await loadOrderChat(orderId);

  if ('error' in loaded) {
    return c.json({ error: loaded.error, code: loaded.code }, loaded.code);
  }

  const { order, chat } = loaded;

  if (order.userId !== userId && order.courierId !== userId && !['owner', 'admin'].includes(role)) {
    return c.json({ error: 'Forbidden', code: 403 }, 403);
  }

  return c.json(chat);
});

chatsRouter.get('/order/:orderId/messages', authMiddleware, async (c) => {
  const orderId = c.req.param('orderId')!;
  const userId = c.get('userId');
  const role = c.get('userRole');
  const loaded = await loadOrderChat(orderId);

  if ('error' in loaded) {
    return c.json({ error: loaded.error, code: loaded.code }, loaded.code);
  }

  const { order, chat } = loaded;

  if (order.userId !== userId && order.courierId !== userId && !['owner', 'admin'].includes(role)) {
    return c.json({ error: 'Forbidden', code: 403 }, 403);
  }

  const chatMessages = await db
    .select({
      id: messages.id,
      sender: messages.sender,
      text: messages.text,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(eq(messages.chatId, chat.id))
    .orderBy(messages.createdAt);

  return c.json(chatMessages);
});

chatsRouter.post('/order/:orderId/messages', authMiddleware, zValidator('json', sendMessageSchema), async (c) => {
  const orderId = c.req.param('orderId')!;
  const userId = c.get('userId');
  const role = c.get('userRole');
  const { text } = c.req.valid('json');
  const loaded = await loadOrderChat(orderId);

  if ('error' in loaded) {
    return c.json({ error: loaded.error, code: loaded.code }, loaded.code);
  }

  const { order, chat } = loaded;
  const sender = resolveSender(order, userId, role);

  if (!sender) {
    return c.json({ error: 'Forbidden', code: 403 }, 403);
  }

  const [message] = await db.insert(messages).values({
    chatId: chat.id,
    sender,
    text,
  }).returning();

  broadcastToChannel(orderChannel(orderId), 'chat_message', message);

  return c.json(message, 201);
});

export default chatsRouter;
