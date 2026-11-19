import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db/index.js';
import {
  users,
  roles,
  orders,
  orderItems,
  products,
  inventory,
  staffSalaries,
  payrollPayments,
  expenses,
  restaurantSettings,
  auditLogs,
} from '../db/schema.js';
import { authMiddleware, allowRoles } from '../middleware/auth.js';
import { eq } from 'drizzle-orm';

const ownerRouter = new Hono();

ownerRouter.use('*', authMiddleware, allowRoles(['owner', 'admin']));

const staffUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(roles).optional(),
  isBlocked: z.boolean().optional(),
  phone: z.string().optional(),
});

const salarySchema = z.object({
  baseSalary: z.number().min(0),
  bonusPercentage: z.number().min(0).max(100),
  currency: z.string().min(1).default('USD'),
});

const payrollSchema = z.object({
  userId: z.string(),
  amount: z.number().positive(),
  type: z.enum(['salary', 'bonus']),
  period: z.string().optional(),
  note: z.string().optional(),
});

const expenseSchema = z.object({
  title: z.string().min(2),
  category: z.string().min(2),
  amount: z.number().positive(),
  note: z.string().optional(),
});

const settingsSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  workingHours: z.string().optional(),
  currency: z.string().min(1).optional(),
  taxRate: z.number().min(0).optional(),
  deliveryFee: z.number().min(0).optional(),
  logo: z.string().optional(),
  cover: z.string().optional(),
});

function startOfDay(date = new Date()) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function startOfWeek(date = new Date()) {
  const copy = startOfDay(date);
  const day = copy.getDay();
  const diff = day === 0 ? 6 : day - 1;
  copy.setDate(copy.getDate() - diff);
  return copy;
}

function startOfMonth(date = new Date()) {
  const copy = startOfDay(date);
  copy.setDate(1);
  return copy;
}

function money(value: string | number | null | undefined) {
  return Number(value ?? 0);
}

function sum(values: Array<string | number | null | undefined>) {
  return values.reduce<number>((total, value) => total + money(value), 0);
}

function isRevenue(order: { paymentStatus: string; status: string }) {
  return order.paymentStatus === 'paid' && order.status !== 'cancelled';
}

async function logAudit(userId: string, action: string, entity: string, entityId?: string, details?: string) {
  try {
    await db.insert(auditLogs).values({ userId, action, entity, entityId, details });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

ownerRouter.get('/overview', async (c) => {
  const now = new Date();
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const [allOrders, allUsers, allInventory, itemRows, monthPayroll, monthExpenses] = await Promise.all([
    db.select().from(orders),
    db.select().from(users),
    db.select().from(inventory),
    db
      .select({
        orderId: orderItems.orderId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        productName: products.name,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id)),
    db.select().from(payrollPayments),
    db.select().from(expenses),
  ]);

  const revenueOrders = allOrders.filter(isRevenue);
  const revenueToday = sum(
    revenueOrders.filter((order) => new Date(order.createdAt ?? 0) >= dayStart).map((order) => order.totalPrice)
  );
  const revenueWeek = sum(
    revenueOrders.filter((order) => new Date(order.createdAt ?? 0) >= weekStart).map((order) => order.totalPrice)
  );
  const revenueMonth = sum(
    revenueOrders.filter((order) => new Date(order.createdAt ?? 0) >= monthStart).map((order) => order.totalPrice)
  );

  const ordersToday = allOrders.filter((order) => new Date(order.createdAt ?? 0) >= dayStart);
  const deliveredToday = ordersToday.filter((order) => order.status === 'delivered');
  const activeOrders = allOrders.filter((order) =>
    ['created', 'paid', 'cooking', 'ready', 'on_the_way'].includes(order.status)
  );

  const revenueOrderIds = new Set(revenueOrders.map((order) => order.id));
  const productTotals = new Map<string, { name: string; quantity: number; revenue: number }>();
  for (const row of itemRows) {
    if (!row.orderId || !revenueOrderIds.has(row.orderId)) continue;
    const entry = productTotals.get(row.productName) ?? { name: row.productName, quantity: 0, revenue: 0 };
    entry.quantity += row.quantity;
    entry.revenue += money(row.price) * row.quantity;
    productTotals.set(row.productName, entry);
  }
  const topProducts = Array.from(productTotals.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const payrollMonthTotal = sum(
    monthPayroll.filter((payment) => new Date(payment.createdAt ?? 0) >= monthStart).map((payment) => payment.amount)
  );
  const expensesMonthTotal = sum(
    monthExpenses.filter((expense) => new Date(expense.createdAt ?? 0) >= monthStart).map((expense) => expense.amount)
  );

  const staffByRole = roles.reduce<Record<string, number>>((acc, role) => {
    acc[role] = allUsers.filter((user) => user.role === role).length;
    return acc;
  }, {});

  const lowStock = allInventory
    .filter((item) => money(item.quantity) <= 10)
    .sort((a, b) => money(a.quantity) - money(b.quantity))
    .slice(0, 8);

  return c.json({
    revenue: {
      today: Number(revenueToday.toFixed(2)),
      week: Number(revenueWeek.toFixed(2)),
      month: Number(revenueMonth.toFixed(2)),
      total: Number(sum(revenueOrders.map((order) => order.totalPrice)).toFixed(2)),
    },
    orders: {
      today: ordersToday.length,
      active: activeOrders.length,
      deliveredToday: deliveredToday.length,
      total: allOrders.length,
      averageValue: Number((revenueOrders.length ? sum(revenueOrders.map((order) => order.totalPrice)) / revenueOrders.length : 0).toFixed(2)),
    },
    finance: {
      payrollMonth: Number(payrollMonthTotal.toFixed(2)),
      expensesMonth: Number(expensesMonthTotal.toFixed(2)),
      netProfitMonth: Number((revenueMonth - payrollMonthTotal - expensesMonthTotal).toFixed(2)),
    },
    staff: {
      total: allUsers.length,
      byRole: staffByRole,
      blocked: allUsers.filter((user) => user.isBlocked).length,
    },
    topProducts,
    lowStock,
    recentOrders: allOrders
      .slice()
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 8),
  });
});

ownerRouter.get('/staff', async (c) => {
  const search = (c.req.query('search') ?? '').toLowerCase().trim();
  const role = c.req.query('role');

  const [allUsers, salaries] = await Promise.all([
    db.select().from(users),
    db.select().from(staffSalaries),
  ]);

  const salaryMap = new Map(salaries.map((salary) => [salary.userId, salary]));

  const staff = allUsers
    .filter((user) => (role ? user.role === role : true))
    .filter((user) => {
      if (!search) return true;
      return [user.name, user.email, user.phone ?? '', user.role].some((value) =>
        value.toLowerCase().includes(search)
      );
    })
    .map((user) => ({
      id: user.id,
      name: user.name,
      slug: user.slug,
      email: user.email,
      role: user.role,
      phone: user.phone,
      cover: user.cover,
      isBlocked: user.isBlocked,
      createdAt: user.createdAt,
      salary: salaryMap.get(user.id) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return c.json(staff);
});

ownerRouter.patch('/staff/:id', zValidator('json', staffUpdateSchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const requesterId = c.get('userId');
  const requesterRole = c.get('userRole');

  const target = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!target) {
    return c.json({ error: 'User not found', code: 404 }, 404);
  }

  if (target.role === 'owner' && requesterRole !== 'owner') {
    return c.json({ error: 'Only the owner can modify an owner account', code: 403 }, 403);
  }

  if (id === requesterId && data.role && data.role !== target.role) {
    return c.json({ error: 'You cannot change your own role', code: 400 }, 400);
  }

  const [updated] = await db.update(users).set(data).where(eq(users.id, id)).returning();

  await logAudit(
    requesterId,
    'staff.update',
    'user',
    id,
    JSON.stringify({ changes: data, previousRole: target.role })
  );

  return c.json({
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    email: updated.email,
    role: updated.role,
    phone: updated.phone,
    isBlocked: updated.isBlocked,
  });
});

ownerRouter.put('/staff/:id/salary', zValidator('json', salarySchema), async (c) => {
  const id = c.req.param('id');
  const data = c.req.valid('json');
  const requesterId = c.get('userId');

  const target = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!target) {
    return c.json({ error: 'User not found', code: 404 }, 404);
  }

  const values = {
    baseSalary: data.baseSalary.toString(),
    bonusPercentage: data.bonusPercentage.toString(),
    currency: data.currency,
    updatedAt: new Date(),
  };

  const [salary] = await db
    .insert(staffSalaries)
    .values({ userId: id, ...values })
    .onConflictDoUpdate({ target: staffSalaries.userId, set: values })
    .returning();

  await logAudit(requesterId, 'salary.update', 'user', id, JSON.stringify(values));

  return c.json(salary);
});

ownerRouter.get('/payroll', async (c) => {
  const period = c.req.query('period');

  const [payments, allUsers] = await Promise.all([
    db.select().from(payrollPayments),
    db.select().from(users),
  ]);

  const userMap = new Map(allUsers.map((user) => [user.id, user]));

  const filtered = payments
    .filter((payment) => (period ? payment.period === period : true))
    .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    .map((payment) => ({
      ...payment,
      user: payment.userId ? userMap.get(payment.userId) ?? null : null,
    }));

  return c.json({
    payments: filtered,
    totals: {
      salary: Number(sum(filtered.filter((payment) => payment.type === 'salary').map((payment) => payment.amount)).toFixed(2)),
      bonus: Number(sum(filtered.filter((payment) => payment.type === 'bonus').map((payment) => payment.amount)).toFixed(2)),
      all: Number(sum(filtered.map((payment) => payment.amount)).toFixed(2)),
    },
  });
});

ownerRouter.post('/payroll', zValidator('json', payrollSchema), async (c) => {
  const data = c.req.valid('json');
  const requesterId = c.get('userId');

  const target = await db.query.users.findFirst({ where: eq(users.id, data.userId) });
  if (!target) {
    return c.json({ error: 'User not found', code: 404 }, 404);
  }

  const [payment] = await db
    .insert(payrollPayments)
    .values({
      userId: data.userId,
      amount: data.amount.toString(),
      type: data.type,
      period: data.period,
      note: data.note,
      createdBy: requesterId,
    })
    .returning();

  await logAudit(
    requesterId,
    data.type === 'bonus' ? 'payroll.bonus' : 'payroll.salary',
    'user',
    data.userId,
    JSON.stringify({ amount: data.amount, period: data.period, note: data.note })
  );

  return c.json(payment, 201);
});

ownerRouter.get('/finances', async (c) => {
  const fromQuery = c.req.query('from');
  const toQuery = c.req.query('to');

  const now = new Date();
  const from = fromQuery ? new Date(fromQuery) : startOfMonth(now);
  const to = toQuery ? new Date(toQuery) : now;
  to.setHours(23, 59, 59, 999);

  const [allOrders, allPayments, allExpenses] = await Promise.all([
    db.select().from(orders),
    db.select().from(payrollPayments),
    db.select().from(expenses),
  ]);

  const inRange = (value: Date | null) => value !== null && value >= from && value <= to;

  const periodOrders = allOrders.filter((order) => inRange(order.createdAt ? new Date(order.createdAt) : null));
  const revenueOrders = periodOrders.filter(isRevenue);
  const periodPayments = allPayments.filter((payment) => inRange(payment.createdAt ? new Date(payment.createdAt) : null));
  const periodExpenses = allExpenses.filter((expense) => inRange(expense.createdAt ? new Date(expense.createdAt) : null));

  const revenue = sum(revenueOrders.map((order) => order.totalPrice));
  const payroll = sum(periodPayments.map((payment) => payment.amount));
  const expenseTotal = sum(periodExpenses.map((expense) => expense.amount));

  const seriesMap = new Map<string, { date: string; revenue: number; payroll: number; expenses: number }>();
  const cursor = new Date(from);
  while (cursor <= to) {
    const key = cursor.toISOString().slice(0, 10);
    seriesMap.set(key, { date: key, revenue: 0, payroll: 0, expenses: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const order of revenueOrders) {
    const key = new Date(order.createdAt ?? 0).toISOString().slice(0, 10);
    const entry = seriesMap.get(key);
    if (entry) entry.revenue += money(order.totalPrice);
  }
  for (const payment of periodPayments) {
    const key = new Date(payment.createdAt ?? 0).toISOString().slice(0, 10);
    const entry = seriesMap.get(key);
    if (entry) entry.payroll += money(payment.amount);
  }
  for (const expense of periodExpenses) {
    const key = new Date(expense.createdAt ?? 0).toISOString().slice(0, 10);
    const entry = seriesMap.get(key);
    if (entry) entry.expenses += money(expense.amount);
  }

  const series = Array.from(seriesMap.values()).map((entry) => ({
    ...entry,
    revenue: Number(entry.revenue.toFixed(2)),
    payroll: Number(entry.payroll.toFixed(2)),
    expenses: Number(entry.expenses.toFixed(2)),
    net: Number((entry.revenue - entry.payroll - entry.expenses).toFixed(2)),
  }));

  return c.json({
    from: from.toISOString(),
    to: to.toISOString(),
    totals: {
      revenue: Number(revenue.toFixed(2)),
      payroll: Number(payroll.toFixed(2)),
      expenses: Number(expenseTotal.toFixed(2)),
      net: Number((revenue - payroll - expenseTotal).toFixed(2)),
      orders: periodOrders.length,
      paidOrders: revenueOrders.length,
    },
    series,
    expenses: periodExpenses.sort(
      (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    ),
    payrollPayments: periodPayments.sort(
      (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
    ),
  });
});

ownerRouter.get('/expenses', async (c) => {
  const rows = await db.select().from(expenses);
  return c.json(
    rows.sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
  );
});

ownerRouter.post('/expenses', zValidator('json', expenseSchema), async (c) => {
  const data = c.req.valid('json');
  const requesterId = c.get('userId');

  const [expense] = await db
    .insert(expenses)
    .values({
      title: data.title,
      category: data.category,
      amount: data.amount.toString(),
      note: data.note,
      createdBy: requesterId,
    })
    .returning();

  await logAudit(requesterId, 'expense.create', 'expense', expense.id, JSON.stringify(data));

  return c.json(expense, 201);
});

ownerRouter.delete('/expenses/:id', async (c) => {
  const id = c.req.param('id');
  const requesterId = c.get('userId');

  const [deleted] = await db.delete(expenses).where(eq(expenses.id, id)).returning();
  if (!deleted) {
    return c.json({ error: 'Expense not found', code: 404 }, 404);
  }

  await logAudit(requesterId, 'expense.delete', 'expense', id, deleted.title);

  return c.json({ success: true });
});

ownerRouter.get('/kitchen', async (c) => {
  const now = new Date();

  const [allOrders, itemRows, allInventory] = await Promise.all([
    db.select().from(orders),
    db
      .select({
        orderId: orderItems.orderId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        productName: products.name,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id)),
    db.select().from(inventory),
  ]);

  const itemsByOrder = new Map<string, Array<{ name: string; quantity: number; price: string }>>();
  for (const row of itemRows) {
    if (!row.orderId) continue;
    const list = itemsByOrder.get(row.orderId) ?? [];
    list.push({ name: row.productName, quantity: row.quantity, price: row.price });
    itemsByOrder.set(row.orderId, list);
  }

  const statuses = ['created', 'paid', 'cooking', 'ready', 'on_the_way'] as const;

  const activeOrders = allOrders
    .filter((order) => statuses.includes(order.status as (typeof statuses)[number]))
    .sort((a, b) => new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime())
    .map((order) => ({
      ...order,
      items: itemsByOrder.get(order.id) ?? [],
      waitingMinutes: Math.max(
        0,
        Math.round((now.getTime() - new Date(order.createdAt ?? 0).getTime()) / 60000)
      ),
    }));

  const counts = statuses.reduce<Record<string, number>>((acc, status) => {
    acc[status] = allOrders.filter((order) => order.status === status).length;
    return acc;
  }, {});

  const lowStock = allInventory
    .filter((item) => money(item.quantity) <= 10)
    .sort((a, b) => money(a.quantity) - money(b.quantity));

  return c.json({
    counts,
    queue: activeOrders,
    oldestWaitingMinutes: activeOrders.length
      ? Math.max(
          0,
          Math.round((now.getTime() - new Date(activeOrders[0].createdAt ?? 0).getTime()) / 60000)
        )
      : 0,
    lowStock,
  });
});

ownerRouter.get('/settings', async (c) => {
  const existing = await db.query.restaurantSettings.findFirst({
    where: eq(restaurantSettings.id, 'main'),
  });

  if (existing) return c.json(existing);

  const [created] = await db.insert(restaurantSettings).values({ id: 'main' }).returning();
  return c.json(created);
});

ownerRouter.patch('/settings', zValidator('json', settingsSchema), async (c) => {
  const data = c.req.valid('json');
  const requesterId = c.get('userId');

  const values: Record<string, unknown> = { ...data, updatedAt: new Date() };
  if (data.taxRate !== undefined) values.taxRate = data.taxRate.toString();
  if (data.deliveryFee !== undefined) values.deliveryFee = data.deliveryFee.toString();

  const [settings] = await db
    .insert(restaurantSettings)
    .values({ id: 'main', ...values })
    .onConflictDoUpdate({ target: restaurantSettings.id, set: values })
    .returning();

  await logAudit(requesterId, 'settings.update', 'restaurant_settings', 'main', JSON.stringify(data));

  return c.json(settings);
});

ownerRouter.get('/audit-logs', async (c) => {
  const [logs, allUsers] = await Promise.all([
    db.select().from(auditLogs),
    db.select().from(users),
  ]);

  const userMap = new Map(allUsers.map((user) => [user.id, user]));

  return c.json(
    logs
      .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
      .slice(0, 200)
      .map((log) => ({
        ...log,
        user: log.userId ? userMap.get(log.userId) ?? null : null,
      }))
  );
});

export default ownerRouter;
