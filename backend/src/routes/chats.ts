import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import { chats, messages, users } from '../db/schema.js';
import { authMiddleware, allowRoles } from '../middleware/auth.js';
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

export default chatsRouter;
