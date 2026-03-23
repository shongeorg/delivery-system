import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = 'http://localhost:3000';

describe('Food Delivery API Tests', () => {
  let authToken: string;
  let userId: string;

  // Health Check
  describe('Health', () => {
    it('should return health status', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.status).toBe('ok');
    });
  });

  // Auth Tests
  describe('Auth', () => {
    it('should register a new user', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: `test${Date.now()}@example.com`,
          password: 'password123',
          phone: '+1234567890',
        }),
      });
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.user).toBeDefined();
      expect(data.accessToken).toBeDefined();
      expect(data.refreshToken).toBeDefined();
      authToken = data.accessToken;
      userId = data.user.id;
    });

    it('should login with owner credentials', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'owner@test.com',
          password: 'owner123',
        }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user.role).toBe('owner');
      expect(data.accessToken).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'owner@test.com',
          password: 'wrongpassword',
        }),
      });
      expect(res.status).toBe(401);
    });
  });

  // Categories Tests
  describe('Categories', () => {
    it('should get all categories', async () => {
      const res = await fetch(`${BASE_URL}/categories`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should get category by slug', async () => {
      const res = await fetch(`${BASE_URL}/categories/pizza`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe('Pizza');
      expect(data.slug).toBe('pizza');
      expect(Array.isArray(data.products)).toBe(true);
    });

    it('should return 404 for non-existent category', async () => {
      const res = await fetch(`${BASE_URL}/categories/nonexistent`);
      expect(res.status).toBe(404);
    });
  });

  // Products Tests
  describe('Products', () => {
    it('should get all products', async () => {
      const res = await fetch(`${BASE_URL}/products`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should get product by slug', async () => {
      const res = await fetch(`${BASE_URL}/products/margherita-pizza`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.name).toBe('Margherita Pizza');
      expect(data.slug).toBe('margherita-pizza');
      expect(data.price).toBeDefined();
    });

    it('should return 404 for non-existent product', async () => {
      const res = await fetch(`${BASE_URL}/products/nonexistent`);
      expect(res.status).toBe(404);
    });
  });

  // Users Tests
  describe('Users', () => {
    it('should get user by slug', async () => {
      const res = await fetch(`${BASE_URL}/users/owner`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.slug).toBe('owner');
      expect(data.name).toBe('Owner');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await fetch(`${BASE_URL}/users/nonexistent`);
      expect(res.status).toBe(404);
    });
  });

  // Protected Routes Tests
  describe('Protected Routes', () => {
    it('should reject request without auth token', async () => {
      const res = await fetch(`${BASE_URL}/users/me`);
      expect(res.status).toBe(401);
    });

    it('should get current user with valid token', async () => {
      // First login to get token
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'owner@test.com',
          password: 'owner123',
        }),
      });
      const loginData = await loginRes.json();
      
      const res = await fetch(`${BASE_URL}/users/me`, {
        headers: { 
          'Authorization': `Bearer ${loginData.accessToken}`,
        },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.email).toBe('owner@test.com');
    });
  });

  // Cart Tests
  describe('Cart', () => {
    it('should reject cart access without auth', async () => {
      const res = await fetch(`${BASE_URL}/cart`);
      expect(res.status).toBe(401);
    });
  });

  // Orders Tests
  describe('Orders', () => {
    it('should reject orders access without auth', async () => {
      const res = await fetch(`${BASE_URL}/orders`);
      expect(res.status).toBe(401);
    });
  });

  // Tags Tests
  describe('Tags', () => {
    it('should get all tags', async () => {
      const res = await fetch(`${BASE_URL}/tags`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  // Reviews Tests
  describe('Reviews', () => {
    it('should get reviews for product', async () => {
      // Get first product
      const productsRes = await fetch(`${BASE_URL}/products`);
      const products = await productsRes.json();
      
      if (products.length > 0) {
        const res = await fetch(`${BASE_URL}/reviews/product/${products[0].id}`);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });
});

console.log('✅ All tests defined! Run with: npm test');
