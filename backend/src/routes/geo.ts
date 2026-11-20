import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';

const geoRouter = new Hono();

const geocodeSchema = z.object({
  address: z.string().min(3),
});

type Coords = { lat: number; lng: number; displayName: string };

const cache = new Map<string, Coords | null>();

geoRouter.post('/geocode', authMiddleware, zValidator('json', geocodeSchema), async (c) => {
  const { address } = c.req.valid('json');
  const key = address.trim().toLowerCase();

  if (cache.has(key)) {
    const hit = cache.get(key);
    if (!hit) return c.json({ error: 'Address not found', code: 404 }, 404);
    return c.json(hit);
  }

  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', address);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');
  url.searchParams.set('addressdetails', '0');

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'delivery-system-dev/1.0',
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) {
      return c.json({ error: 'Geocoding service unavailable', code: 502 }, 502);
    }

    const data = await res.json() as Array<{ lat: string; lon: string; display_name: string }>;

    if (!Array.isArray(data) || data.length === 0) {
      cache.set(key, null);
      return c.json({ error: 'Address not found', code: 404 }, 404);
    }

    const result: Coords = {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      displayName: data[0].display_name,
    };

    cache.set(key, result);
    return c.json(result);
  } catch {
    return c.json({ error: 'Geocoding request failed', code: 502 }, 502);
  }
});

export default geoRouter;
