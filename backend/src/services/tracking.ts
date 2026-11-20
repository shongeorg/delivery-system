import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { courierLocations, orders } from '../db/schema.js';

export type LocationResult =
  | { ok: true; orderId: string; courierId: string; lat: number; lng: number; updatedAt: string }
  | { ok: false; error: string; code: number };

export async function saveCourierLocation(
  orderId: string,
  courierId: string,
  lat: number,
  lng: number
): Promise<LocationResult> {
  const order = await db.query.orders.findFirst({
    where: eq(orders.id, orderId),
  });

  if (!order) {
    return { ok: false, error: 'Order not found', code: 404 };
  }

  if (order.courierId !== courierId) {
    return { ok: false, error: 'Order is not assigned to you', code: 403 };
  }

  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return { ok: false, error: 'Invalid coordinates', code: 400 };
  }

  const updatedAt = new Date();

  await db
    .insert(courierLocations)
    .values({
      courierId,
      orderId,
      lat: lat.toString(),
      lng: lng.toString(),
      updatedAt,
    })
    .onConflictDoUpdate({
      target: courierLocations.courierId,
      set: {
        orderId,
        lat: lat.toString(),
        lng: lng.toString(),
        updatedAt,
      },
    });

  return {
    ok: true,
    orderId,
    courierId,
    lat,
    lng,
    updatedAt: updatedAt.toISOString(),
  };
}
