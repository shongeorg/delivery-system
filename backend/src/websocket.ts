import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { orders, users } from './db/schema.js';
import { saveCourierLocation } from './services/tracking.js';

const JWT_SECRET = process.env.JWT_SECRET!;

interface Client {
  ws: WebSocket;
  userId?: string;
  role?: string;
  channels: Set<string>;
}

const clients = new Map<string, Client>();

interface ActiveCall {
  id: string;
  a: string;
  b: string;
  orderId: string | null;
  mode: 'order' | 'support';
  createdAt: number;
}

const calls = new Map<string, ActiveCall>();

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
      endCallsForUser(client.userId);
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
    case 'call_invite':
      handleCallInvite(client, message);
      break;
    case 'call_accept':
    case 'call_decline':
    case 'call_end':
    case 'webrtc_offer':
    case 'webrtc_answer':
    case 'ice_candidate':
      handleCallSignal(client, message);
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

export function isUserOnline(userId: string) {
  return [...clients.values()].some(
    (client) => client.userId === userId && client.ws.readyState === WebSocket.OPEN
  );
}

export function isSupportOnline() {
  return [...clients.values()].some(
    (client) =>
      (client.role === 'owner' || client.role === 'admin') &&
      client.ws.readyState === WebSocket.OPEN
  );
}

export function sendToUser(userId: string, payload: unknown) {
  clients.forEach((client) => {
    if (client.userId === userId) {
      send(client, payload);
    }
  });
}

function unavailable(client: Client, callId: string | undefined, reason: string) {
  send(client, { type: 'call_unavailable', data: { callId, reason } });
}

async function handleCallInvite(client: Client, message: any) {
  if (!client.userId) {
    return unavailable(client, message.callId, 'Authenticate first');
  }

  const callId = typeof message.callId === 'string' ? message.callId : '';
  if (!callId || calls.has(callId)) return;

  const mode: 'order' | 'support' = message.mode === 'support' ? 'support' : 'order';
  const orderId = typeof message.orderId === 'string' ? message.orderId : null;

  const caller = await db.query.users.findFirst({
    where: eq(users.id, client.userId),
    columns: { id: true, name: true, role: true },
  });

  if (!caller) return;

  let target: string | null = null;

  if (mode === 'support') {
    const support = [...clients.values()].find(
      (candidate) =>
        (candidate.role === 'owner' || candidate.role === 'admin') &&
        candidate.userId &&
        candidate.ws.readyState === WebSocket.OPEN
    );

    if (!support?.userId) {
      return unavailable(client, callId, 'Support is offline');
    }

    target = support.userId;
  } else {
    if (!orderId) {
      return unavailable(client, callId, 'Order is required');
    }

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      columns: { userId: true, courierId: true },
    });

    const participants = [order?.userId, order?.courierId].filter(
      (id): id is string => Boolean(id)
    );

    if (!order || !participants.includes(client.userId)) {
      return unavailable(client, callId, 'Forbidden');
    }

    target = participants.find((id) => id !== client.userId) ?? null;

    if (!target) {
      return unavailable(client, callId, 'The other side is not assigned yet');
    }
  }

  if (!isUserOnline(target)) {
    return unavailable(client, callId, 'The other side is offline');
  }

  calls.set(callId, {
    id: callId,
    a: client.userId,
    b: target,
    orderId,
    mode,
    createdAt: Date.now(),
  });

  sendToUser(target, {
    type: 'call_invite',
    data: {
      callId,
      orderId,
      mode,
      from: { id: caller.id, name: caller.name, role: caller.role },
    },
  });

  send(client, { type: 'call_ringing', data: { callId, to: target } });
}

function handleCallSignal(client: Client, message: any) {
  const call = calls.get(message.callId);

  if (!call || !client.userId) return;
  if (call.a !== client.userId && call.b !== client.userId) return;

  const peerId = call.a === client.userId ? call.b : call.a;

  if (message.type === 'call_decline' || message.type === 'call_end') {
    calls.delete(call.id);
  }

  sendToUser(peerId, {
    type: message.type,
    data: {
      callId: call.id,
      from: client.userId,
      sdp: message.sdp,
      candidate: message.candidate,
    },
  });
}

function endCallsForUser(userId?: string) {
  if (!userId) return;

  calls.forEach((call) => {
    if (call.a !== userId && call.b !== userId) return;

    const peerId = call.a === userId ? call.b : call.a;
    sendToUser(peerId, { type: 'call_end', data: { callId: call.id, from: userId } });
    calls.delete(call.id);
  });
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
