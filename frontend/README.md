# Customer App (`frontend`)

Вітрина доставки: каталог, кошик, checkout зі Stripe, історія замовлень, трекінг кур'єра і чат. SvelteKit 5 на `http://localhost:3031`, API — `http://localhost:3000`.

## Стек

| Шар | Вибір |
|---|---|
| Фреймворк | SvelteKit 2 + Svelte 5 (runes: `$state`, `$derived`, `$effect`) |
| Збірка | Vite 7 |
| Стилі | Tailwind CSS 4 (`@tailwindcss/vite`) |
| Карти | Leaflet 1.9 + OpenStreetMap |
| Платежі | `@stripe/stripe-js` (Elements) |
| Тести | Vitest + Playwright |

## Команди

```bash
npm install
npm run dev      # 3031
npm run build
npm run preview
npm run check    # svelte-check
```

`.env`:

```
PUBLIC_API_URL=http://localhost:3000
PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Маршрути

| Шлях | Призначення |
|---|---|
| `/` | Головна: категорії, меню (12 на сторінку), бейдж кошика |
| `/catalog` | Повний каталог із пагінацією |
| `/category/:slug` | Страви категорії |
| `/product/:slug` | Картка страви, «Add to Cart» |
| `/cart` | Кошик: кількість, видалення, «Proceed to Checkout» |
| `/checkout` | Доставка/самовивіз, адреса, геолокація, оплата карткою або готівкою |
| `/orders` | Мої замовлення, посилання «Track order» |
| `/orders/:id` | **Трекінг:** таймлайн, карта з кур'єром, чат, деталі |
| `/login`, `/register` | Авторизація |
| `/profile/:slug` | Профіль |

## Клієнт API

`src/lib/api.ts` — тонка обгортка над `fetch`:

- додає `Authorization` з `localStorage`;
- на `401` робить `POST /auth/refresh` (з дедуплікацією через `refreshInFlight`) і повторює запит один раз;
- повертає `{ data, error, status }` замість винятків.

Функції: `getProducts`, `getProduct`, `getCategories`, `getCart`, `addToCart`, `updateCartItem`, `removeFromCart`, `clearCart`, `getMyOrders`, `getOrder`, `getOrderTracking`, `createOrder`, `getOrderChat`, `getOrderMessages`, `sendOrderMessage`, `geocodeAddress`, `createPaymentIntent`, `confirmPayment`, `getCurrentUser`, `updateCurrentUser`.

## Трекінг

`src/routes/orders/[id]/+page.svelte`:

- `GET /orders/:id/tracking` + полінг 5 с;
- WS `ws://localhost:3000/ws`: `auth` → `subscribe order:<id>`, далі `order_updated`, `courier_location`, `chat_message`;
- Leaflet: темний маркер клієнта, індиго-маркер кур'єра, лінія між ними, `fitBounds`;
- картка кур'єра з `tel:`, чат, деталі замовлення;
- при `delivered` полінг зупиняється.

Якщо чат або трекінг недоступні (немає токена) — показується помилка з посиланням на `/login`.

## Checkout

- Позиції й сума з кошика; адреса й телефон підставляються з `/users/me`.
- Кнопка «Use my location» → `navigator.geolocation.getCurrentPosition`; координати йдуть у `POST /orders`.
- Якщо координат немає на submit — `POST /geo/geocode` на бекенді (Nominatim), інакше замовлення створюється без точки.
- Картка: PaymentIntent → `stripe.confirmCardPayment` → `POST /payments/confirm`.
- Готівка: замовлення створюється одразу, `paymentStatus` лишається `pending`.

## Обмеження

- `npm run check` показує помилки типізації в `login`, `register`, `profile`, `checkout`, `product` (переважно `data: unknown` і `user` possibly null) — це застарілі місця, не пов'язані з новими сторінками.
- Немає UI відгуків, скасування замовлення і профільного редагування адреси.
- Геолокація потребує дозволу; за відмови використовується геокодинг адреси.
- Готівкові замовлення не позначаються оплаченими автоматично.