import { OpenAPIHono } from '@hono/zod-openapi';
import { apiReference } from '@scalar/hono-api-reference';
import { authOpenAPI } from './auth.js';
import { productsOpenAPI } from './products.js';
import { categoriesOpenAPI } from './categories.js';

export const openAPIApp = new OpenAPIHono();

// Mount all OpenAPI sub-routers so they appear in the spec
openAPIApp.route('/auth', authOpenAPI);
openAPIApp.route('/products', productsOpenAPI);
openAPIApp.route('/categories', categoriesOpenAPI);

// OpenAPI spec endpoint
openAPIApp.doc('/docs/openapi.json', {
  openapi: '3.0.0',
  info: {
    title: 'Food Delivery API',
    version: '1.0.0',
    description: 'Food Delivery Backend API with Hono + Drizzle',
  },
  servers: [{ url: 'http://localhost:3000/api' }],
});

// Scalar API Reference UI
openAPIApp.get('/docs', apiReference({
  theme: 'kepler',
  url: '/api/docs/openapi.json',
}));
