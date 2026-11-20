import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { orders } from './db/schema.js';
import { saveCourierLocation } from './services/tracking.js';

const JWT_SECRET = process.env.JWT_SECRET!;

interface Client {
  ws: WebSocket;
  userId?: string;
  role?: string;
  channels: Set<string>;
}

const clients = new Map<string, Client>();

function send(client: Client, payload: unknown) {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(payload));
  }
}

export function orderChannel(orderId: string) {
  return `order:${orderId}`;
}

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const clientId = generateClientId();
    const client: Client = { ws, channels: new Set() };
    clients.set(clientId, client);

    console.log(`WebSocket client connected: ${clientId}`);

    ws.send(JSON.stringify({ type: 'connected', clientId }));

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(clientId, message);
      } catch {
        send(client, { type: 'error', message: 'Invalid JSON' });
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      console.log(`WebSocket client disconnected: ${clientId}`);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });
  });

  return wss;
}

function generateClientId(): string {
  return Math.random().toString(36).substring(2, 15);
}

function handleMessage(clientId: string, message: any) {
  const client = clients.get(clientId);
  if (!client) return;

  switch (message.type) {
    case 'auth':
      handleAuth(client, message.token);
      break;
    case 'subscribe':
      handleSubscribe(client, message.channel);
      break;
    case 'unsubscribe':
      handleUnsubscribe(client, message.channel);
      break;
    case 'courier_location_update':
      handleCourierLocation(client, message);
      break;
    default:
      send(client, { type: 'error', message: 'Unknown message type' });
  }
}

function handleAuth(client: Client, token: string) {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    client.userId = payload.userId;
    client.role = payload.role;
    send(client, { type: 'auth', status: 'success' });
  } catch {
    send(client, { type: 'auth', status: 'error', message: 'Invalid token' });
  }
}

function canAccessOrder(order: { userId: string | null; courierId: string | null }, client: Client) {
  if (!client.userId) return false;
  if (order.userId === client.userId) return true;
  if (order.courierId === client.userId) return true;
  return ['owner', 'admin', 'chef'].includes(client.role ?? '');
}

async function handleSubscribe(client: Client, channel: string) {
  if (!client.userId) {
    send(client, { type: 'error', message: 'Authenticate before subscribing' });
    return;
  }

  if (channel.startsWith('order:')) {
    const orderId = channel.slice('order:'.length);
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: { userId: true, courierId: true },
    });

    if (!order || !canAccessOrder(order, client)) {
      send(client, { type: 'error', message: 'Forbidden channel' });
      return;
    }
  }

  client.channels.add(channel);
  send(client, { type: 'subscribed', channel });
}

function handleUnsubscribe(client: Client, channel: string) {
  client.channels.delete(channel);
  send(client, { type: 'unsubscribed', channel });
}

async function handleCourierLocation(client: Client, message: any) {
  if (client.role !== 'courier' || !client.userId) {
    send(client, { type: 'error', message: 'Only couriers can share location' });
    return;
  }

  const result = await saveCourierLocation(message.orderId, client.userId, Number(message.lat), Number(message.lng));

  if (!result.ok) {
    send(client, { type: 'error', message: result.error });
    return;
  }

  const payload = {
    orderId: result.orderId,
    courierId: result.courierId,
    lat: result.lat,
    lng: result.lng,
    updatedAt: result.updatedAt,
  };

  broadcastToChannel(orderChannel(result.orderId), 'courier_location', payload);
  broadcastToRole('owner', 'courier_location', payload);
  broadcastToRole('admin', 'courier_location', payload);
}

export function broadcast(event: string, data: any) {
  const message = JSON.stringify({ type: event, data });
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

export function broadcastToUser(userId: string, event: string, data: any) {
  const message = JSON.stringify({ type: event, data });
  clients.forEach((client) => {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

export function broadcastToRole(role: string, event: string, data: any) {
  const message = JSON.stringify({ type: event, data });
  clients.forEach((client) => {
    if (client.role === role && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

export function broadcastToChannel(channel: string, event: string, data: any) {
  const message = JSON.stringify({ type: event, data });
  clients.forEach((client) => {
    if (client.channels.has(channel) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}
