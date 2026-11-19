# 👑 Owner Panel

Restaurant control center for the Food Delivery System. Built with React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router and Recharts.

Runs on **http://localhost:3034** and talks to the Hono backend on **http://localhost:3000**.

Only users with the `owner` role can open the panel. The backend additionally allows `admin` for the same API routes.

---

## Features

| Page | Route | What it does |
|------|-------|--------------|
| Dashboard | `/` | Revenue today / week / month, active orders, net profit, staff counters, top products, low stock, recent orders. Refreshes every 15 s. |
| Staff | `/staff` | Search and filter all accounts, inline role change, block / unblock, salary terms modal. |
| Staff details | `/staff/:id` | Profile, salary terms, calculated bonus, accrued bonus, full payment history. |
| Payroll | `/payroll` | Payroll totals, month filter, record salary or bonus payments, payment history. |
| Finances | `/finances` | Date-range revenue / payroll / expenses / net profit, daily cash-flow chart, expenses CRUD, payroll in period. |
| Kitchen | `/kitchen` | Live queue by status, waiting time per order, order items, oldest-order alert, low stock. Refreshes every 10 s. |
| Restaurant | `/settings` | Name, logo / cover URLs with preview, phone, address, working hours, currency, tax rate, delivery fee. |
| Audit logs | `/audit-logs` | Every salary, payroll, expense, settings and product price/delete change with user and payload. |

---

## Auth flow

1. `POST /auth/login` returns `accessToken` (15 min), `refreshToken` (7 days) and the user.
2. Both tokens are stored in `localStorage`.
3. `src/api/axios.ts` attaches `Authorization: Bearer <accessToken>` to every request.
4. On `401` the interceptor calls `POST /auth/refresh` once, stores the rotated refresh token and replays the original request. If the refresh fails, tokens are cleared and the browser is redirected to `/login`.
5. `OwnerGuard` calls `GET /users/me` on boot and renders the panel only for `role === 'owner'`.

---

## Getting started

```bash
cd ower-panel
npm install
npm run dev      # http://localhost:3034
npm run build    # tsc -b && vite build
npm run preview
```

The backend must be running:

```bash
cd backend
npm run dev      # http://localhost:3000
```

Sign in with the seed owner account:

```
owner@test.com / owner123
```

> The folder name starts with a Cyrillic `с` only for `сhef-panel`. This one is `ower-panel` (ASCII `o`).

---

## Backend API

All routes require `Authorization: Bearer <token>` and the `owner` or `admin` role.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/owner/overview` | Dashboard aggregates |
| GET | `/owner/staff?search=&role=` | Accounts with salary terms |
| PATCH | `/owner/staff/:id` | Change name, phone, role, blocked flag |
| PUT | `/owner/staff/:id/salary` | Upsert base salary, bonus %, currency |
| GET | `/owner/payroll?period=YYYY-MM` | Payments + totals |
| POST | `/owner/payroll` | Record salary or bonus |
| GET | `/owner/finances?from=&to=` | Totals, daily series, expenses, payroll |
| GET | `/owner/expenses` | Expense list |
| POST | `/owner/expenses` | Create expense |
| DELETE | `/owner/expenses/:id` | Delete expense |
| GET | `/owner/kitchen` | Status counts, active queue with items, low stock |
| GET | `/owner/settings` | Restaurant settings (creates defaults on first read) |
| PATCH | `/owner/settings` | Update restaurant settings |
| GET | `/owner/audit-logs` | Latest 200 audit records |

### Payload examples

```json
PUT /owner/staff/:id/salary
{ "baseSalary": 2500, "bonusPercentage": 10, "currency": "USD" }
```

```json
POST /owner/payroll
{ "userId": "...", "amount": 250, "type": "bonus", "period": "2026-11", "note": "Peak shift" }
```

```json
POST /owner/expenses
{ "title": "Flour delivery", "category": "supplies", "amount": 180.5, "note": "Weekly restock" }
```

```json
PATCH /owner/settings
{ "name": "FoodDelivery", "currency": "USD", "taxRate": 8, "deliveryFee": 3.5 }
```

---

## Data model

New tables in `backend/src/db/schema.ts`:

| Table | Purpose |
|-------|---------|
| `staff_salaries` | One salary record per user: `base_salary`, `bonus_percentage`, `currency` |
| `payroll_payments` | Immutable salary / bonus payments with period, note and author |
| `expenses` | Purchases and operating costs with category |
| `restaurant_settings` | Single row (`id = 'main'`) with branding, contact and system settings |
| `audit_logs` | Actor, action, entity, entity id and JSON details |

`users` also gained `is_blocked`. Apply schema changes with:

```bash
cd backend
npm run db:push
```

---

## Net profit

```
net profit = paid revenue (status != cancelled)
           − payroll payments in period
           − expenses in period
```

Revenue is counted only for orders with `paymentStatus = 'paid'` and `status != 'cancelled'`.

---

## Verification

```bash
cd ower-panel
npm run build     # TypeScript + production bundle
```

Smoke-tested against the seeded database:

- owner login and guard
- dashboard aggregates
- staff role change and salary upsert
- bonus payment and payment history
- expense create / delete
- kitchen queue and low stock
- settings save
- audit log entries

---

## Known limitations

- Currency formatting is fixed to `$` in the UI even if another currency is selected.
- Revenue uses order creation date, not a separate payment timestamp.
- The panel has no ESLint config; use `npm run build` for verification.
- Charts are bundled with the app (single ~730 kB JS chunk, gzip ~211 kB).
