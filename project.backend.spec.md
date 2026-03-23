````md
# 🍕 Food Delivery Backend Specification (Hono + Neon PostgreSQL + Drizzle)

---

## 1. Stack

- Runtime: Node.js
- Framework: Hono
- Database: Neon PostgreSQL
- ORM: Drizzle ORM
- Validation: Zod
- API Docs: Hono OpenAPI
- Auth: JWT + Refresh Token
- Realtime: WebSocket
- Payments: Stripe

---

## 2. Core Rules

- Все сущности:
  - `name` (required)
  - `slug` (required, unique, generated)
  - `cover` (optional)

- `slug` используется на фронте вместо `id`

---

## 3. Roles (enum)

```ts
export const roles = ["owner", "admin", "customer", "chef", "courier"] as const;
```
````

---

## 4. Database Schema (Drizzle)

### users

```ts
users = pgTable("users", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  email: text("email").unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull(),
  cover: text("cover"),
  phone: text("phone"),
  address: text("address"),
  isBlockedFromReviews: boolean("is_blocked_from_reviews").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

### refresh_tokens

```ts
refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

### categories

```ts
categories = pgTable("categories", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  cover: text("cover"),
  description: text("description"),
});
```

---

### products

```ts
products = pgTable("products", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  cover: text("cover"),
  price: numeric("price").notNull(),
  description: text("description"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

### tags

```ts
tags = pgTable("tags", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
});
```

---

### product_categories

```ts
productCategories = pgTable(
  "product_categories",
  {
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "cascade",
    }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.productId, t.categoryId] }),
  }),
);
```

---

### product_tags

```ts
productTags = pgTable(
  "product_tags",
  {
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),
    tagId: uuid("tag_id").references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.productId, t.tagId] }),
  }),
);
```

---

### ingredients

```ts
ingredients = pgTable("ingredients", {
  id: uuid("id").primaryKey(),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "cascade",
  }),
  name: text("name").notNull(),
  quantity: numeric("quantity").notNull(),
  unit: text("unit").notNull(),
});
```

---

### inventory

```ts
inventory = pgTable("inventory", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  quantity: numeric("quantity").notNull(),
  unit: text("unit").notNull(),
  cover: text("cover"),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

### orders

```ts
orders = pgTable("orders", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  totalPrice: numeric("total_price").notNull(),
  status: text("status").notNull(),
  deliveryType: text("delivery_type").notNull(),
  address: text("address"),
  phone: text("phone"),
  paymentType: text("payment_type").notNull(),
  paymentStatus: text("payment_status").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

### order_items

```ts
orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey(),
  orderId: uuid("order_id").references(() => orders.id, {
    onDelete: "cascade",
  }),
  productId: uuid("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: numeric("price").notNull(),
});
```

---

### reviews

```ts
reviews = pgTable(
  "reviews",
  {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id").references(() => users.id),
    productId: uuid("product_id").references(() => products.id),
    rating: integer("rating").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => ({
    uniqueUserProduct: unique().on(t.userId, t.productId),
  }),
);
```

---

### carts

```ts
carts = pgTable("carts", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id")
    .unique()
    .references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

---

### cart_items

```ts
cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey(),
  cartId: uuid("cart_id").references(() => carts.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
});
```

---

### chats / messages

```ts
chats = pgTable("chats", {
  id: uuid("id").primaryKey(),
  userId: uuid("user_id").references(() => users.id),
});
```

```ts
messages = pgTable("messages", {
  id: uuid("id").primaryKey(),
  chatId: uuid("chat_id").references(() => chats.id, { onDelete: "cascade" }),
  sender: text("sender").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

## 5. Auth

- email + password
- bcrypt hash
- JWT access
- refresh token (DB)

---

## 6. Slug System

- auto from name
- lowercase
- replace spaces → `-`
- unique fallback: `slug-1`

---

## 7. Orders Flow

```
created → paid → cooking → ready → on_the_way → delivered
```

---

## 8. Cart Sync

- REST = source of truth
- WebSocket = realtime sync

---

## 9. WebSocket

### events:

- order_updated
- new_message
- cart_updated

---

## 10. Reviews Rules

- 1 user → 1 review per product
- user → edit/delete own
- admin/owner → full control
- blocked → cannot create

---

## 11. Delivery Logic

- default from user profile
- editable before confirm

---

## 12. Validation

- Zod для всех входных данных

---

## 13. OpenAPI

- все routes описаны через Hono OpenAPI

---

## 14. Access Control

```ts
allowRoles(["owner", "admin"]);
```

---

## 15. Migrations (Drizzle)

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

- схема = код
- SQL генерируется автоматически
- контроль через git

---

## 16. Seeds

### обязательно после миграций:

- создать owner
- создать базовые категории
- создать тестовые продукты
- создать теги

```ts
await db.insert(users).values({
  name: "Owner",
  slug: "owner",
  email: "owner@test.com",
  passwordHash: "...",
  role: "owner",
});
```

---

## 17. Logging

- auth
- orders
- payments
- admin actions

---

## 18. Error Format

```json
{
  "error": "message",
  "code": 400
}
```

```

```

# Тестові дані створені:

Owner: owner@test.com / owner123
Admin: admin@test.com / admin123
5 категорій (Pizza, Burgers, Sushi, Salads, Desserts)
6 продуктів з картинками з Unsplash
8 тегів
5 позицій інвентарю

# OPENAI_API_KEY_MCP_SERVER

https://mcp.scalar.com/mcp/01af2be0-95de-4a28-a452-71f3514f3adf

# Порт-мапа:

🔧 Backend (Hono + Neon): http://localhost:3000 ✅
🎨 Frontend (SvelteKit) : http://localhost:3031
📦 Courier App (Vue PWA): http://localhost:3032
👨‍🍳 Chef Panel (React): http://localhost:3033
👑 Owner Panel (Angular): http://localhost:3034
