# 🍕 Food Delivery System — Project Context

> **Історичний документ.** Описує початковий задум і не відповідає поточному коду (курьерський застосунок уже реалізовано, з'явилися owner-панель, трекінг, чат). Актуальний стан: [`README.md`](./README.md) і [`docs/`](./docs/).

## Project Overview

A full-stack food delivery platform consisting of three applications:

| Application | Status | Stack |
|-------------|--------|-------|
| **Backend** | ✅ Implemented | Hono + Neon PostgreSQL + Drizzle ORM |
| **Frontend** | ✅ Implemented | SvelteKit + TailwindCSS + Leaflet |
| **Courier App** | 📐 Specified only | Vue 3 + Vite + PWA (not implemented) |

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │     │    Backend       │     │   Neon          │
│   SvelteKit     │────▶│    Hono API      │────▶│   PostgreSQL    │
│   Port: 1212    │◀────│    Port: 3000    │     │                 │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         ▲                       │
         │ WebSocket             │ Stripe
         │                       ▼
┌─────────────────┐     ┌──────────────────┐
│  Courier App    │     │   External APIs  │
│  Vue 3 PWA      │     │   (Stripe, OSM)  │
│  (planned)      │     │                  │
└─────────────────┘     └──────────────────┘
```

---

## Tech Stack

### Backend (`/backend`)
- **Runtime:** Node.js
- **Framework:** Hono (v4)
- **Database:** Neon PostgreSQL
- **ORM:** Drizzle ORM (v0.45)
- **Validation:** Zod
- **Auth:** JWT + Refresh Tokens (stored in DB)
- **Password Hashing:** bcryptjs
- **Payments:** Stripe
- **Realtime:** WebSocket (ws)
- **API Docs:** OpenAPI + Scalar UI
- **Testing:** Vitest

### Frontend (`/frontend`)
- **Framework:** SvelteKit (v2)
- **Styling:** TailwindCSS (v4)
- **Maps:** Leaflet
- **State:** Svelte stores
- **API Client:** Native fetch with credentials
- **Testing:** Vitest (unit) + Playwright (e2e)

### Courier App (`/courier-app`)
- Not yet implemented
- Planned: Vue 3 + Vite + PWA + Pinia + Leaflet

---

## Database Schema (16 Tables)

| Table | Description |
|-------|-------------|
| `users` | User accounts with roles |
| `refresh_tokens` | JWT refresh tokens |
| `categories` | Product categories |
| `products` | Menu items |
| `tags` | Product tags |
| `product_categories` | M:N relation |
| `product_tags` | M:N relation |
| `ingredients` | Product ingredients |
| `inventory` | Stock management |
| `orders` | Customer orders |
| `order_items` | Order line items |
| `reviews` | Product reviews |
| `carts` | User carts |
| `cart_items` | Cart line items |
| `chats` | Support chats |
| `messages` | Chat messages |

### User Roles

```ts
type Role = 'owner' | 'admin' | 'chef' | 'courier' | 'customer'
```

---

## Building and Running

### Prerequisites
- Node.js (v20+)
- Neon PostgreSQL database
- Stripe account (for payments)

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run db:push
npm run db:seed
npm run dev
```

**Backend runs at:** `http://localhost:3000`

**API Docs:** `http://localhost:3000/api/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

**Frontend runs at:** `http://localhost:1212` (configured via `.env.local`)

### Courier App

Not implemented yet. See `project.courier-app.spec.md` for specifications.

---

## Scripts Reference

### Backend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (tsx watch) |
| `npm run build` | TypeScript build |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed database with test data |
| `npm test` | Run Vitest tests |

### Frontend

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run check` | Type check with Svelte Check |
| `npm test` | Run unit + e2e tests |

---

## Test Accounts (Seed Data)

| Email | Password | Role |
|-------|----------|------|
| `owner@test.com` | `owner123` | owner |
| `admin@test.com` | `admin123` | admin |

---

## API Endpoints Summary

### Auth
- `POST /auth/register` — Register new user
- `POST /auth/login` — Login
- `POST /auth/refresh` — Refresh access token

### Protected Routes (🔒)
- `GET /users/me` — Get current user
- `PATCH /users/me` — Update current user
- `GET /products` — Get all products
- `GET /products/:slug` — Get product by slug
- `GET /categories` — Get all categories
- `GET /categories/:slug` — Get category with products
- `GET /orders` — Get orders (role-based access)
- `GET /orders/my` — Get my orders
- `POST /orders` — Create order
- `GET /cart` — Get my cart
- `POST /cart/items` — Add item to cart
- `PATCH /cart/items/:id` — Update quantity
- `DELETE /cart/items/:id` — Remove item

### Admin Only (🔒 admin/owner)
- `POST /products` — Create product
- `PATCH /products/:id` — Update product
- `DELETE /products/:id` — Delete product
- `POST /categories` — Create category
- `PATCH /categories/:id` — Update category
- `DELETE /categories/:id` — Delete category

### Payments
- `POST /payments/create-intent` — Create Stripe payment intent
- `POST /payments/webhook` — Stripe webhook handler

### WebSocket
- Connect to `ws://localhost:3000/ws`
- Events: `auth`, `subscribe`
- Server broadcasts: `order_updated`, `new_message`, `cart_updated`

---

## Order Status Flow

```
created → paid → cooking → ready → on_the_way → delivered
                                              ↘ cancelled
```

---

## Project Structure

```
delivery-system/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts      # Drizzle schema (16 tables)
│   │   │   ├── index.ts       # DB connection
│   │   │   └── seed.ts        # Seed data
│   │   ├── routes/            # API route handlers
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── products.ts
│   │   │   ├── categories.ts
│   │   │   ├── tags.ts
│   │   │   ├── orders.ts
│   │   │   ├── cart.ts
│   │   │   ├── reviews.ts
│   │   │   ├── inventory.ts
│   │   │   ├── chats.ts
│   │   │   └── payments.ts
│   │   ├── openapi/           # OpenAPI documentation
│   │   │   └── index.ts       # Scalar UI setup
│   │   ├── middleware/
│   │   │   └── auth.ts        # JWT + role middleware
│   │   ├── utils/
│   │   │   ├── auth.ts        # bcrypt + JWT helpers
│   │   │   └── slug.ts        # Slug generator
│   │   ├── tests/
│   │   │   └── api.test.ts    # Vitest API tests
│   │   ├── websocket.ts       # WebSocket server
│   │   └── index.ts           # App entry point
│   ├── drizzle.config.ts
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── routes/            # SvelteKit pages
│   │   ├── lib/
│   │   │   ├── components/    # Reusable components
│   │   │   ├── stores/        # Svelte stores
│   │   │   ├── api/           # API client
│   │   │   └── map/           # Leaflet utilities
│   │   └── app.html
│   ├── static/
│   ├── tests/
│   ├── playwright.config.ts
│   ├── svelte.config.js
│   ├── vite.config.ts
│   └── .env.example
├── courier-app/               # (not implemented)
├── project.backend.spec.md    # Backend specification
├── project.frontend.spec.md   # Frontend specification
├── project.courier-app.spec.md # Courier app specification
└── README.md
```

---

## Development Conventions

### Code Style
- TypeScript for all code
- ES modules (`"type": "module"`)
- Consistent naming: camelCase for variables/functions, PascalCase for types/components

### Testing
- Backend: Vitest for API testing
- Frontend: Vitest (unit) + Playwright (e2e)

### Database
- Schema defined in code (Drizzle ORM)
- Migrations generated via `drizzle-kit generate`
- Applied via `drizzle-kit push`

### Environment Variables

**Backend (.env):**
```env
POSTGRES_URL=postgresql://...
JWT_SECRET=your-secret-key-min-64-chars
JWT_REFRESH_SECRET=another-secret
STRIPE_SECRET_KEY=sk_test_...
```

**Frontend (.env.local or .env):**
```env
PUBLIC_API_URL=http://localhost:3000
PUBLIC_WS_URL=ws://localhost:3000/ws
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Key Principles

1. **Slug-based routing:** All entities use `slug` for frontend URLs instead of IDs
2. **REST + WebSocket:** REST for CRUD, WebSocket for realtime updates
3. **Role-based access:** Middleware enforces role permissions
4. **Single source of truth:** Backend is authoritative for data state
5. **Cart sync:** Cart synchronized via REST (source) + WebSocket (updates)

---

## Common Tasks

### Add new API endpoint
1. Create route handler in `backend/src/routes/`
2. Add OpenAPI documentation in `backend/src/openapi/`
3. Add tests in `backend/src/tests/`

### Add new database table
1. Add table to `backend/src/db/schema.ts`
2. Run `npm run db:generate` then `npm run db:push`
3. Update seed data if needed

### Add new frontend page
1. Create route in `frontend/src/routes/`
2. Add API calls in `frontend/src/lib/api/`
3. Add stores if needed in `frontend/src/lib/stores/`

---

## Troubleshooting

### Database connection issues
- Verify `POSTGRES_URL` in `.env`
- Check Neon dashboard for connection string

### Port conflicts
- Backend: default `3000`
- Frontend: default `1212` (via `.env.local`)

### WebSocket not connecting
- Ensure backend is running
- Check `PUBLIC_WS_URL` matches backend WebSocket endpoint

---

## Related Documentation

- `project.backend.spec.md` — Detailed backend specification
- `project.frontend.spec.md` — Detailed frontend specification
- `project.courier-app.spec.md` — Courier app specification (planned)
