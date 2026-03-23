# 🍕 Food Delivery System

Full-stack food delivery platform built with modern technologies.

---

## Stack

### Backend
- **Runtime**: Node.js
- **Framework**: [Hono](https://hono.dev/)
- **Database**: [Neon PostgreSQL](https://neon.tech/)
- **ORM**: [Drizzle ORM](https://orm.drizzle.team/)
- **Validation**: [Zod](https://zod.dev/)
- **Auth**: JWT + Refresh Tokens
- **Realtime**: WebSocket
- **Payments**: Stripe
- **API Docs**: OpenAPI + Scalar UI
- **Tests**: Vitest

---

## Project Structure

```
delivery-system/
├── backend/                  # Hono API server
│   ├── src/
│   │   ├── db/
│   │   │   ├── schema.ts     # Drizzle schema (all 16 tables)
│   │   │   ├── index.ts      # DB connection
│   │   │   └── seed.ts       # Seed data
│   │   ├── routes/           # API route handlers
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
│   │   ├── openapi/          # OpenAPI documented routes
│   │   │   ├── index.ts      # Scalar UI setup
│   │   │   ├── auth.ts
│   │   │   ├── products.ts
│   │   │   └── categories.ts
│   │   ├── middleware/
│   │   │   └── auth.ts       # JWT + role middleware
│   │   ├── utils/
│   │   │   ├── auth.ts       # bcrypt + JWT helpers
│   │   │   └── slug.ts       # Slug generator
│   │   ├── tests/
│   │   │   └── api.test.ts   # Vitest API tests
│   │   ├── websocket.ts      # WebSocket server
│   │   └── index.ts          # App entry point
│   ├── drizzle.config.ts
│   ├── tsconfig.json
│   ├── vitest.config.ts
│   └── .env.example
├── frontend/                 # (coming soon)
├── courier-app/              # (coming soon)
└── .gitignore
```

---

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url>
cd delivery-system/backend
npm install
```

### 2. Setup environment

```bash
cp .env.example .env
# Fill in your values in .env
```

Required:
- `POSTGRES_URL` — Neon PostgreSQL connection string
- `JWT_SECRET` — random secret (min 64 chars)
- `JWT_REFRESH_SECRET` — another random secret
- `STRIPE_SECRET_KEY` — from Stripe dashboard

### 3. Push DB schema & seed

```bash
npm run db:push
npm run db:seed
```

### 4. Run development server

```bash
npm run dev
```

Server starts at `http://localhost:3000`

---

## API Docs

Interactive API documentation (Scalar UI):

```
http://localhost:3000/api/docs
```

---

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login |
| POST | `/auth/refresh` | Refresh access token |

### Users
| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me` | Get current user 🔒 |
| PATCH | `/users/me` | Update current user 🔒 |
| GET | `/users/:slug` | Get user by slug |

### Products
| Method | Path | Description |
|--------|------|-------------|
| GET | `/products` | Get all products |
| GET | `/products/:slug` | Get product by slug |
| POST | `/products` | Create product 🔒 admin/owner |
| PATCH | `/products/:id` | Update product 🔒 admin/owner |
| DELETE | `/products/:id` | Delete product 🔒 admin/owner |

### Categories
| Method | Path | Description |
|--------|------|-------------|
| GET | `/categories` | Get all categories |
| GET | `/categories/:slug` | Get category with products |
| POST | `/categories` | Create category 🔒 admin/owner |
| PATCH | `/categories/:id` | Update category 🔒 admin/owner |
| DELETE | `/categories/:id` | Delete category 🔒 admin/owner |

### Tags
| Method | Path | Description |
|--------|------|-------------|
| GET | `/tags` | Get all tags |
| GET | `/tags/:slug` | Get tag with products |
| POST | `/tags` | Create tag 🔒 admin/owner |
| DELETE | `/tags/:id` | Delete tag 🔒 admin/owner |

### Orders
| Method | Path | Description |
|--------|------|-------------|
| GET | `/orders` | Get all orders 🔒 admin/owner/chef/courier |
| GET | `/orders/my` | Get my orders 🔒 |
| GET | `/orders/:id` | Get order by id 🔒 |
| POST | `/orders` | Create order 🔒 |
| PATCH | `/orders/:id/status` | Update status 🔒 admin/owner/chef/courier |
| POST | `/orders/:id/cancel` | Cancel order 🔒 |

### Cart
| Method | Path | Description |
|--------|------|-------------|
| GET | `/cart` | Get my cart 🔒 |
| POST | `/cart/items` | Add item to cart 🔒 |
| PATCH | `/cart/items/:id` | Update item quantity 🔒 |
| DELETE | `/cart/items/:id` | Remove item 🔒 |
| DELETE | `/cart` | Clear cart 🔒 |

### Reviews
| Method | Path | Description |
|--------|------|-------------|
| GET | `/reviews/product/:productId` | Get product reviews |
| POST | `/reviews` | Create review 🔒 |
| PATCH | `/reviews/:id` | Update review 🔒 |
| DELETE | `/reviews/:id` | Delete review 🔒 |

### Inventory
| Method | Path | Description |
|--------|------|-------------|
| GET | `/inventory` | Get all inventory 🔒 admin/owner/chef |
| POST | `/inventory` | Create item 🔒 admin/owner |
| PATCH | `/inventory/:id/quantity` | Update quantity 🔒 |
| DELETE | `/inventory/:id` | Delete item 🔒 admin/owner |

### Payments
| Method | Path | Description |
|--------|------|-------------|
| POST | `/payments/create-intent` | Create Stripe payment intent 🔒 |
| POST | `/payments/webhook` | Stripe webhook handler |

### Chats
| Method | Path | Description |
|--------|------|-------------|
| GET | `/chats` | Get chats 🔒 |
| POST | `/chats` | Get or create chat 🔒 |
| GET | `/chats/:id/messages` | Get chat messages 🔒 |
| POST | `/chats/:id/messages` | Send message 🔒 |

---

## WebSocket

Connect to `ws://localhost:3000/ws`

### Events

```json
// Authenticate
{ "type": "auth", "token": "<access_token>" }

// Subscribe to channel
{ "type": "subscribe", "channel": "orders" }
```

### Server broadcasts

| Event | Trigger |
|-------|---------|
| `order_updated` | Order status changed |
| `new_message` | New chat message |
| `cart_updated` | Cart changed |

---

## Roles

| Role | Access |
|------|--------|
| `owner` | Full access |
| `admin` | Full access except owner actions |
| `chef` | Orders, inventory |
| `courier` | Orders |
| `customer` | Own orders, cart, reviews |

---

## Order Flow

```
created → paid → cooking → ready → on_the_way → delivered
                                              ↘ cancelled
```

---

## Seed Data (test accounts)

| Email | Password | Role |
|-------|----------|------|
| `owner@test.com` | `owner123` | owner |
| `admin@test.com` | `admin123` | admin |

---

## Scripts

```bash
npm run dev          # Start dev server (tsx watch)
npm run build        # TypeScript build
npm run start        # Start production server
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to DB
npm run db:studio    # Open Drizzle Studio
npm run db:seed      # Seed database
npm test             # Run Vitest tests
```
