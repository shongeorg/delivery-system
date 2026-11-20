# Courier App

Vue 3 PWA для кур'єра: черга доставок, прийняття замовлення, маршрут до клієнта, передача локації, чат і завершення доставки. Порт **3032**, API — **http://localhost:3000**.

## Стек

| Шар | Вибір |
|---|---|
| Фреймворк | Vue 3.5 (`<script setup>`) |
| Збірка | Vite 7 |
| Маршрутизація | vue-router 5 (`createWebHistory`) |
| Стан | Pinia 3 (`auth`, `order`, `chat`, `location`, `socket`) |
| HTTP | axios з інтерсептором refresh-retry |
| Карти | Leaflet 1.9 + OpenStreetMap + OSRM |
| Стилі | Tailwind 4 (`@tailwindcss/postcss`) + токени Material 3 |
| PWA | vite-plugin-pwa |

## Команди

```bash
npm install
npm run dev      # 3032
npm run build
npm run preview
```

Бекенд мусить працювати на 3000; CORS дозволяє 3032.

## Маршрути

| Шлях | View | Призначення |
|---|---|---|
| `/` | `LoginView` | Вхід; редірект на `/orders`, якщо токен є |
| `/orders` | `OrdersView` | Вкладки Available / Active / Completed |
| `/orders/:id` | `OrderDetailView` | Деталі, маршрут, чат, дії зі статусом |
| `/orders/:id/map` | `OrderRouteView` | Маршрут до клієнта (OSRM), передача локації |
| `/map` | `MapView` | Загальна карта з поточною позицією |
| `/profile` | `ProfileView` | Профіль, статистика, вихід |

`src/router/index.js` — guard повертає цільовий шлях (без `next()`).

## Авторизація

`src/stores/auth.js`: `POST /auth/login`, токени й `user` у `localStorage`, `init()` відновлює, `logout()` чистить.

`src/api/client.js` — єдиний axios-інстанс:

- додає `Authorization: Bearer <accessToken>`;
- на `401` один раз викликає `authStore.refresh()` (дедуплікація через `refreshInFlight`) і повторює запит;
- якщо refresh не вдався — `logout()` і `window.location.replace('/')`.

Демо-акаунти (є кнопки на екрані входу): `cura1@mail.com` / `cura123`, `cura2@mail.com` / `cura123`.

## Дані й стан

- `stores/order.js` — `fetchOrders`, `fetchOrderById`, `updateStatus` через `api/client.js`.
- `stores/chat.js` — `load(orderId)`, `send(orderId, text)`, `receive(message)`; повідомлення приходять із `GET/POST /chats/order/:orderId/messages` і з WS.
- `stores/location.js` — `watchPosition` → `latitude`/`longitude`, `startTracking()` / `stopTracking()`.
- `stores/socket.js` — `ws://localhost:3000/ws`: `auth` → `subscribe` на `orders` і на `order:<id>`; обробляє `new_order`, `order_updated`, `order_cancelled` (перезавантаження), `chat_message` (у чат-стор), перепідключається через 3 с; `sendLocationUpdate(orderId, lat, lng)`.

## Екрани

### `/orders`

Статистика (Available / Active / Completed) і фільтр-таби. Картка: короткий id, адреса (2 рядки), склад замовлення, «time ago», статус-чип, сума. Автоперезавантаження 15 с, скелетони, банер помилки з Retry, порожній стан.

Фільтр на клієнті: `deliveryType === 'delivery'` і `ready` / `on_the_way` / `delivered`. Це **всі** доставки системи, не лише «мої».

### `/orders/:id`

Stepper (Ready → On the way → Delivered), адреса з кнопкою **Route**, телефон із `Call`, оплата, позиції, сума. Sticky-панель: «Accept & pick up» (`ready → on_the_way`) або «Mark as delivered» (`on_the_way → delivered`). Картка **Chat** з історією та відправкою. Полінг 15 с, підписка на `order:<id>`.

### `/orders/:id/map`

Карта на весь екран: маркер кур'єра, маркер клієнта, маршрут OSRM (відстань, ETA) або пунктирна пряма, якщо OSRM недоступний. «Fit both» і «Share my location». Локація надсилається у WS і HTTP не частіше ніж раз на 8 с. Без дозволу на геолокацію кнопка неактивна, а картка показує адресу й «Route is being prepared».

### `/map`

Загальна карта з власною позицією і карткою активної доставки.

### `/profile`

Аватар, ім'я, email, роль; лічильники Delivered / On the way; рядки акаунта; вихід.

## Дизайн

`src/style.css` — Tailwind 4 `@theme` + компонентні класи Material 3: Google Blue `#0b57d0`, тональні контейнери, Roboto, картки 24 px, pill-кнопки, `.field`, статус-чипи, `.bottom-nav` з індикатором, `.skeleton`, `.spinner` на нативному `<progress>`, safe-area, `--target-size` 24→44 px, `prefers-reduced-motion`. Іконки — інлайн SVG, без емодзі й іконкових шрифтів.

## PWA

`vite.config.js`: manifest («Delivery Courier», standalone, portrait, `theme_color: #f7f9fc`), іконки 192/512, `registerType: autoUpdate`. `index.html`: `viewport-fit=cover`, `mobile-web-app-capable`, Roboto з preconnect.

## Відомі обмеження

- Список доставок не фільтрується за кур'єром; «Available» — усі `ready` доставки, «Active» — усі `on_the_way`. Хто перший натиснув «Accept», той і призначений (`courierId`), другий отримає `409`.
- Чат завантажується при відкритті й оновлюється подією `chat_message`; якщо сокет впав, нові повідомлення з'являться лише після повторного відкриття сторінки.
- Маршрут потребує і власної позиції, і точки клієнта; інакше показується лише адреса.
- Геолокація працює на `localhost` або HTTPS; у тестовому Chrome вона `denied`, тому маршрут у перевірці не будувався.
- `tailwind.config.js` — невикористаний залишок; реальна тема в `src/style.css`.