import type { Context, Next } from 'hono';
import { verifyAccessToken } from '../utils/auth.js';
import type { Role } from '../db/schema.js';

declare module 'hono' {
  interface ContextVariableMap {
    userId: string;
    userRole: Role;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized', code: 401 }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyAccessToken(token);
    c.set('userId', payload.userId);
    c.set('userRole', payload.role as Role);
    await next();
  } catch {
    return c.json({ error: 'Invalid token', code: 401 }, 401);
  }
}

export function allowRoles(allowedRoles: Role[]) {
  return async (c: Context, next: Next) => {
    const userRole = c.get('userRole');
    
    if (!allowedRoles.includes(userRole)) {
      return c.json({ error: 'Forbidden', code: 403 }, 403);
    }
    
    await next();
  };
}
