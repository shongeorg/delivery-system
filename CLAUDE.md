# CLAUDE.md

> **Історичний документ.** Описує ранній стан репозиторію; частина тверджень застаріла. Актуально: [`README.md`](./README.md), [`docs/`](./docs/), [`AGENTS.md`](./AGENTS.md).

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Start

```bash
cd backend
npm install
cp .env.example .env  # Fill in required values
npm run db:push && npm run db:seed
npm run dev          # Server at http://localhost:3000
```

## Common Commands

All commands run from `backend/`:

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with tsx watch |
| `npm run build` | TypeScript compile to `dist/` |
| `npm run start` | Run production build |
| `npm run db:push` | Sync Drizzle schema to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:studio` | Open Drizzle Studio UI |
| `npm run db:seed` | Seed database with test data |
| `npm run db:clear` | Clear products from database |
| `npm test` | Run Vitest test suite |

## Architecture

### Backend Stack
- **Framework**: Hono (Node.js) with `@hono/node-server`
- **Database**: Neon PostgreSQL via Drizzle ORM
- **Validation**: Zod with `@hono/zod-validator`
- **Auth**: JWT access/refresh tokens + bcrypt
- **Realtime**: WebSocket server (ws)
- **Payments**: Stripe
- **Docs**: OpenAPI + Scalar UI at `/api/docs`

### Project Structure
```
backend/
├── src/
│   ├── db/              # Drizzle schema, connection, seeding
│   ├── routes/          # API route handlers (Hono routers)
│   ├── openapi/         # OpenAPI documented routes
│   ├── middleware/      # authMiddleware, allowRoles
│   ├── utils/           # auth helpers, slug generator
│   ├── tests/           # Vitest tests
│   ├── websocket.ts     # WS event handlers
│   └── index.ts         # App entry, route registration
├── drizzle/             # Generated migrations
├── drizzle.config.ts
└── vitest.config.ts
```

### Key Patterns

**Route Organization**: Routes are split into `routes/` (all endpoints) and `openapi/` (documented subset). OpenAPI routes use `@hono/zod-openapi` for schema generation.

**Authentication**: `authMiddleware` from `src/middleware/auth.ts` validates JWT tokens and sets `c.set('userId')` / `c.set('userRole')`. Use `allowRoles(['admin', 'owner'])` for role-based access.

**Database**: Single schema file at `src/db/schema.ts` defines all 16 tables. Drizzle ORM with `defaultRandom()` for UUID primary keys.

**Error Handling**: Global `onError` and `notFound` handlers in `src/index.ts` return JSON responses.

## Testing

Tests use Vitest with supertest patterns. Run entire suite:
```bash
npm test
```

Test files live in `src/tests/`. Tests hit the running server at `localhost:3000`.

## Environment Variables

Required in `.env`:
- `POSTGRES_URL` — Neon connection string
- `JWT_SECRET`, `JWT_REFRESH_SECRET` — 64+ char secrets
- `STRIPE_SECRET_KEY` — for payments
- `PORT` (default: 3000)

## Roles System

Five roles defined in `src/db/schema.ts`: `owner` > `admin` > `chef` > `courier` > `customer`. Middleware enforces access via `allowRoles()`.

## Test Accounts (seeded)
- `owner@test.com` / `owner123`
- `admin@test.com` / `admin123`

## Port Map

| Service | Port | Stack |
|---------|------|-------|
| Backend | 3000 | Hono + Neon |
| Frontend | 3031 | SvelteKit |
| Courier App | 3032 | Vue 3 + PWA |
| Chef Panel | 3033 | React |
| Owner Panel | 3034 | Angular |

## Courier App (Vue 3 PWA)

Located in `courier-app/`. Mobile-first PWA for delivery couriers.

### Stack
- Vue 3 (Composition API)
- Vite + PWA plugin
- Pinia (state management)
- Vue Router
- TailwindCSS
- Leaflet (maps)
- WebSocket for realtime

### Structure
```
courier-app/
├── src/
│   ├── views/           # Page components (Login, Orders, Map, Profile)
│   ├── stores/          # Pinia stores (auth, order, location, socket)
│   ├── router/          # Vue Router config
│   ├── style.css        # Tailwind styles
│   ├── main.js          # App entry
│   └── App.vue          # Root component
├── index.html           # PWA manifest setup
└── vite.config.js       # Vite + PWA config
```

### Stores
- `auth.js` — JWT authentication, localStorage persistence
- `order.js` — Fetch/manage orders, status updates
- `location.js` — Geolocation tracking via `watchPosition`
- `socket.js` — WebSocket connection for realtime events

### Commands
```bash
cd courier-app
npm install
npm run dev      # Start at http://localhost:3032
npm run build    # Production build
npm run preview  # Preview production build
```

### Features
- Login with courier credentials
- View available and active orders
- Update order status (Accept → Delivered)
- Map view with Leaflet + OpenStreetMap
- Bottom navigation (Orders, Map, Profile)
- PWA: installable, offline support, push notifications
