# 👨‍🍳 Food Delivery Chef Panel Specification (React + Vite + Tailwind)

## 1. Stack

- **Framework:** React 18+ (Vite)
- **Styling:** TailwindCSS
- **State Management:** TanStack Query (React Query) — для серверного стану
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React
- **Auth:** JWT (Access + Refresh)

---

## 2. Access Control & Security

- **Allowed Roles:** `owner`, `admin`, `chef`
- **Auth Flow:**
  - Доступ до будь-якого роуту (крім `/login`) лише з валідним `accessToken`.
  - Перевірка ролі користувача при ініціалізації додатку та на рівні API.
  - Токен передається в заголовку `Authorization: Bearer <token>`.

---

## 3. Routing

- `/login` — Вхід.
- `/` — Дашборд (статистика залишків, останні замовлення).
- `/recipes` — Список страв (Меню).
- `/recipes/new` — Створення рецепта.
- `/recipes/edit/[slug]` — Редагування рецепта.
- `/inventory` — Склад (продукти та розхідники).

---

## 4. Features

### 4.1. Recipe Management (Menu)

Редагування сутності `products`.

- **Поля:** назва, ціна, категорія, теги, опис, фото.
- **Інгредієнти:** динамічне додавання зв'язків з таблицею `ingredients`.
- **Slug:** автоматична генерація при створенні.

### 4.2. Inventory Control (Склад)

Робота з таблицею `inventory`.

- **Типи позицій:**
  - **Харчові:** картопля (кг), м'ясо (кг), соуси (л).
  - **Розхідники:** тарілки (шт), виделки (шт), палички для суші (шт).
- **Дії:** швидке оновлення кількості (`quantity`) прямо зі списку.
- **Low Stock Alert:** візуальне виділення позицій, де кількість близька до нуля.

---

## 5. Components UI

- **InventoryTable:** таблиця з inline-редагуванням кількості.
- **RecipeForm:** складна форма з можливістю додавати/видаляти поля інгредієнтів.
- **RoleGuard:** High Order Component (HOC) для перевірки прав доступу.
- **Layout:** бічна панель (Sidebar) з навігацією.

---

## 6. API Integration (Endpoints)

- `GET /inventory` — отримати список залишків.
- `PATCH /inventory/:id` — оновити кількість.
- `GET /products` — список страв шефа.
- `POST /products` — створення нової позиції в меню.
- `GET /categories` & `GET /tags` — для випадаючих списків у формі.

---

## 7. Structure

```text
src/
  api/          # axios instances, hooks (useQuery)
  components/   # UI Kit (Button, Input, Table)
  features/     # Модулі: recipes, inventory, auth
  hooks/        # useAuth, useRole
  pages/        # сторінки додатку
```

---

## 8. Development Rule

- **Clean Code:** Жодних коментарів у коді.
- **Validation:** Кожна форма валідується через Zod перед відправкою на Hono API.
