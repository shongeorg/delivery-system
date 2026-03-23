import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

interface Client {
  ws: WebSocket;
  userId?: string;
  role?: string;
}

const clients = new Map<string, Client>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const clientId = generateClientId();
    const client: Client = { ws };
    clients.set(clientId, client);

    console.log(`WebSocket client connected: ${clientId}`);

    // Send welcome message
    ws.send(JSON.stringify({ type: 'connected', clientId }));

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        handleMessage(clientId, message);
      } catch {
        ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
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
      handleAuth(clientId, message.token);
      break;
    case 'subscribe':
      handleSubscribe(clientId, message.channel);
      break;
    default:
      client.ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

function handleAuth(clientId: string, token: string) {
  const client = clients.get(clientId);
  if (!client) return;

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; role: string };
    client.userId = payload.userId;
    client.role = payload.role;
    client.ws.send(JSON.stringify({ type: 'auth', status: 'success' }));
  } catch {
    client.ws.send(JSON.stringify({ type: 'auth', status: 'error', message: 'Invalid token' }));
  }
}

function handleSubscribe(clientId: string, channel: string) {
  const client = clients.get(clientId);
  if (!client) return;

  // Subscribe to channel
  client.ws.send(JSON.stringify({ type: 'subscribed', channel }));
}

// Broadcast to all connected clients
export function broadcast(event: string, data: any) {
  const message = JSON.stringify({ type: event, data });
  clients.forEach((client) => {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

// Broadcast to specific user
export function broadcastToUser(userId: string, event: string, data: any) {
  const message = JSON.stringify({ type: event, data });
  clients.forEach((client) => {
    if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}

// Broadcast to role
export function broadcastToRole(role: string, event: string, data: any) {
  const message = JSON.stringify({ type: event, data });
  clients.forEach((client) => {
    if (client.role === role && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  });
}
