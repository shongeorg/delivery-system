# API

Базовий URL: `http://localhost:3000`. Усі відповіді — JSON. Захищені маршрути вимагають `Authorization: Bearer <accessToken>`. Помилки: `{ "error": "...", "code": 4xx }`.

Інтерактивна документація (частина маршрутів): `http://localhost:3000/api/docs`, специфікація — `/api/docs/openapi.json`. OpenAPI покриває `auth`, `products`, `categories`; решта описана тут.

## Auth

| Метод | Шлях | Доступ | Опис |
|---|---|---|---|
| POST | `/auth/register` | публічно | Створює `customer`, видає пару токенів |
| POST | `/auth/login` | публічно | `{ email, password }` → `{ user, accessToken, refreshToken }` |
| POST | `/auth/refresh` | публічно | `{ refreshToken }` → нова пара; старий refresh видаляється |

Access — 15 хв, refresh — 7 днів (зберігається в `refresh_tokens`).

## Users

| Метод | Шлях | Доступ | Опис |
|---|---|---|---|
| GET | `/users/me` | будь-яка автентифікована | Поточний користувач |
| PATCH | `/users/me` | будь-яка | Ім'я, телефон, адреса, аватар |
| GET | `/users/:slug` | публічно | Публічний профіль |
| PATCH | `/users/:id/role` | owner/admin | Зміна ролі |

## Каталог

| Метод | Шлях | Доступ | Опис |
|---|---|---|---|
| GET | `/products` | публічно | `{ products, pagination }`, `page`, `limit`, пошук/фільтри |
| GET | `/products/:slug` | публічно | Продукт із категоріями, тегами, інгредієнтами |
| POST | `/products` | owner/admin | Створити |
| PATCH | `/products/:id` | owner/admin | Оновити (зміна ціни пише audit log) |
| DELETE | `/products/:id` | owner/admin | Видалити (пише audit log) |
| GET | `/categories` | публічно | Масив категорій |
| GET | `/categories/:slug` | публічно | `{ category, products, pagination }` |
| POST/PATCH/DELETE | `/categories...` | owner/admin | CRUD |
| GET | `/tags` | публічно | Масив тегів |
| GET | `/tags/:slug` | публічно | Тег із продуктами |
| POST/DELETE | `/tags...` | owner/admin | CRUD |
| GET | `/inventory` | owner/admin/chef | Масив залишків |
| GET | `/inventory/:slug` | owner/admin/chef | Один запис |
| POST | `/inventory` | owner/admin | Створити |
| PATCH | `/inventory/:id/quantity` | owner/admin/chef | Змінити кількість |
| DELETE | `/inventory/:id` | owner/admin | Видалити |

Форми відповідей нерівномірні: `/products` і `/categories/:slug` повертають об'єкт із `pagination`, а `/categories`, `/tags`, `/inventory`, `/orders` — масиви.

## Кошик

| Метод | Шлях | Доступ | Опис |
|---|---|---|---|
| GET | `/cart` | автентифікована | `{ cart, items }` |
| POST | `/cart/items` | автентифікована | `{ productId, quantity }` |
| PATCH | `/cart/items/:id` | автентифікована | Кількість |
| DELETE | `/cart/items/:id` | автентифікована | Прибрати позицію |
| DELETE | `/cart` | автентифікована | Очистити |

## Замовлення

| Метод | Шлях | Доступ | Опис |
|---|---|---|---|
| GET | `/orders` | owner/admin/chef/courier | Усі замовлення (масив), з `items`, `user`, `courier` |
| GET | `/orders/my` | автентифікована | Замовлення поточного користувача |
| GET | `/orders/:id` | власник або staff/кур'єр | Одне замовлення з позиціями |
| GET | `/orders/:id/tracking` | власник, призначений кур'єр, staff | `{ order, client, courier, location }` |
| POST | `/orders` | автентифікована | `{ deliveryType, address?, phone, paymentType, lat?, lng?, items[] }` |
| PATCH | `/orders/:id/status` | staff або кур'єр | `{ status }`, переходи з матриці |
| PUT | `/orders/:id/location` | кур'єр, призначений на замовлення | `{ lat, lng }` |
| POST | `/orders/:id/cancel` | власник або owner/admin | Лише `created`/`paid` |

Створення замовлення очищає кошик і розсилає `new_order`.

## Платежі

| Метод | Шлях | Доступ | Опис |
|---|---|---|---|
| POST | `/payments/create-intent` | власник замовлення | Створює PaymentIntent, повертає `clientSecret` |
| POST | `/payments/confirm` | власник замовлення | Перевіряє PaymentIntent і ставить `paid` |
| POST | `/payments/webhook` | підпис Stripe | `payment_intent.succeeded` / `.failed` |

## Чат

| Метод | Шлях | Доступ | Опис |
|---|---|---|---|
| GET | `/chats/order/:orderId` | учасник замовлення | Отримати або створити чат |
| GET | `/chats/order/:orderId/messages` | учасник | Історія повідомлень |
| POST | `/chats/order/:orderId/messages` | учасник | `{ text }` |
| GET | `/chats` | автентифікована | Свої чати; owner/admin — усі |
| POST | `/chats` | автентифікована | Чат без замовлення (legacy) |
| GET | `/chats/:id/messages` | учасник | Legacy-історія |
| POST | `/chats/:id/messages` | учасник | Legacy-повідомлення |

## Гео

| Метод | Шлях | Доступ | Опис |
|---|---|---|---|
| POST | `/geo/geocode` | автентифікована | `{ address }` → `{ lat, lng, displayName }`; `404` якщо не знайдено, `502` якщо Nominatim недоступний |

## Відгуки

| Метод | Шлях | Доступ | Опис |
|---|---|---|---|
| GET | `/reviews/product/:productId` | публічно | Відгуки продукту |
| POST | `/reviews` | автентифікована | Створити (унікально на пару user+product) |
| PATCH | `/reviews/:id` | автор | Оновити |
| DELETE | `/reviews/:id` | автор | Видалити |

## Owner

Усі маршрути вимагають `owner` або `admin`.

| Метод | Шлях | Опис |
|---|---|---|
| GET | `/owner/overview` | Дохід (today/week/month/total), замовлення, середній чек, персонал, топ-продукти, низький залишок |
| GET | `/owner/staff` | Акаунти з умовами оплати (`search`, `role`) |
| PATCH | `/owner/staff/:id` | Роль, ім'я, телефон, блокування |
| PUT | `/owner/staff/:id/salary` | `{ baseSalary, bonusPercentage, currency }` |
| GET | `/owner/payroll` | Виплати й підсумки (`period=YYYY-MM`) |
| POST | `/owner/payroll` | `{ userId, amount, type, period?, note? }` |
| GET | `/owner/finances` | Дохід, payroll, витрати, чистий прибуток, денний ряд |
| GET | `/owner/expenses` | Список витрат |
| POST | `/owner/expenses` | Створити витрату |
| DELETE | `/owner/expenses/:id` | Видалити витрату |
| GET | `/owner/kitchen` | Черга, `waitingMinutes`, `courier` для призначених, низький залишок |
| GET | `/owner/settings` | Налаштування закладу |
| PATCH | `/owner/settings` | Оновити налаштування |
| GET | `/owner/audit-logs` | Останні записи журналу (`limit`) |

## Службове

| Метод | Шлях | Опис |
|---|---|---|
| GET | `/health` | `{ "status": "ok" }` |
| GET | `/api/docs` | Scalar UI |
| GET | `/api/docs/openapi.json` | OpenAPI-специфікація (часткова) |

## Коди відповіді

| Код | Коли |
|---|---|
| 200 | Успіх |
| 201 | Створено (замовлення, повідомлення) |
| 400 | Невалідне тіло або недозволений стан |
| 401 | Немає/прострочений токен |
| 403 | Роль або чужий ресурс |
| 404 | Не знайдено |
| 409 | Конфлікт переходу статусу або замовлення вже прийняте іншим кур'єром |
| 502 | Зовнішній сервіс (Nominatim) недоступний |