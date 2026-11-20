import { pgTable, uuid, text, timestamp, boolean, numeric, integer, primaryKey, unique } from 'drizzle-orm/pg-core';

// Roles enum
export const roles = ['owner', 'admin', 'customer', 'chef', 'courier'] as const;
export type Role = typeof roles[number];

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  role: text('role').notNull(),
  cover: text('cover'),
  phone: text('phone'),
  address: text('address'),
  isBlockedFromReviews: boolean('is_blocked_from_reviews').default(false),
  isBlocked: boolean('is_blocked').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Refresh tokens
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Categories
export const categories = pgTable('categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  cover: text('cover'),
  description: text('description'),
});

// Products
export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  cover: text('cover'),
  price: numeric('price').notNull(),
  description: text('description'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Tags
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
});

// Product-Categories junction
export const productCategories = pgTable('product_categories', {
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.productId, t.categoryId] }),
}));

// Product-Tags junction
export const productTags = pgTable('product_tags', {
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.productId, t.tagId] }),
}));

// Ingredients
export const ingredients = pgTable('ingredients', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: numeric('quantity').notNull(),
  unit: text('unit').notNull(),
});

// Inventory
export const inventory = pgTable('inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  quantity: numeric('quantity').notNull(),
  unit: text('unit').notNull(),
  cover: text('cover'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Orders
export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  totalPrice: numeric('total_price').notNull(),
  status: text('status').notNull(),
  deliveryType: text('delivery_type').notNull(),
  address: text('address'),
  phone: text('phone'),
  paymentType: text('payment_type').notNull(),
  paymentStatus: text('payment_status').notNull(),
  courierId: uuid('courier_id').references(() => users.id),
  lat: numeric('lat'),
  lng: numeric('lng'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Order items
export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(),
  price: numeric('price').notNull(),
});

// Reviews
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  productId: uuid('product_id').references(() => products.id),
  rating: integer('rating').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({
  uniqueUserProduct: unique().on(t.userId, t.productId),
}));

// Carts
export const carts = pgTable('carts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').unique().references(() => users.id),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Cart items
export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  cartId: uuid('cart_id').references(() => carts.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  quantity: integer('quantity').notNull(),
});

// Chats
export const chats = pgTable('chats', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  orderId: uuid('order_id').unique().references(() => orders.id, { onDelete: 'cascade' }),
});

// Messages
export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  chatId: uuid('chat_id').references(() => chats.id, { onDelete: 'cascade' }),
  sender: text('sender').notNull(),
  text: text('text').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Courier locations
export const courierLocations = pgTable('courier_locations', {
  courierId: uuid('courier_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  lat: numeric('lat').notNull(),
  lng: numeric('lng').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Staff salary terms
export const staffSalaries = pgTable('staff_salaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').unique().references(() => users.id, { onDelete: 'cascade' }),
  baseSalary: numeric('base_salary').notNull().default('0'),
  bonusPercentage: numeric('bonus_percentage').notNull().default('0'),
  currency: text('currency').notNull().default('USD'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payroll payments
export const payrollPayments = pgTable('payroll_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  amount: numeric('amount').notNull(),
  type: text('type').notNull(),
  period: text('period'),
  note: text('note'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Expenses
export const expenses = pgTable('expenses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  amount: numeric('amount').notNull(),
  note: text('note'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

// Restaurant settings
export const restaurantSettings = pgTable('restaurant_settings', {
  id: text('id').primaryKey().default('main'),
  name: text('name').notNull().default('FoodDelivery'),
  phone: text('phone'),
  address: text('address'),
  workingHours: text('working_hours'),
  currency: text('currency').notNull().default('USD'),
  taxRate: numeric('tax_rate').notNull().default('0'),
  deliveryFee: numeric('delivery_fee').notNull().default('0'),
  logo: text('logo'),
  cover: text('cover'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Audit logs
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow(),
});
