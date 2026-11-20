# Courier App

Vue 3 PWA for couriers: sign in, browse ready deliveries, accept one, track the route on a map and mark it delivered. Runs on **http://localhost:3032** and talks to the backend on **http://localhost:3000**.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Vue 3.5 (`<script setup>`, Composition API) |
| Build | Vite 7 |
| Routing | vue-router 5 (`createWebHistory`) |
| State | Pinia 3 |
| HTTP | axios |
| Map | Leaflet 1.9 + OpenStreetMap raster tiles |
| Styles | Tailwind CSS 4 (`@tailwindcss/postcss`) + Material 3 design tokens |
| PWA | vite-plugin-pwa (auto-update, standalone, portrait) |

## Commands

Run from `courier-app/`:

```bash
npm install
npm run dev      # dev server on 3032
npm run build    # production build into dist/
npm run preview  # serve the built app
```

The backend must be running on port 3000 (`cd backend && npm run dev`). CORS in `backend/src/index.ts` allows 3032.

## Routes

| Path | View | Auth |
|------|------|------|
| `/` | `LoginView` | public; redirects to `/orders` when a token exists |
| `/orders` | `OrdersView` | required |
| `/orders/:id` | `OrderDetailView` | required |
| `/map` | `MapView` | required |
| `/profile` | `ProfileView` | required |

`src/router/index.js` guards with `router.beforeEach` and returns the redirect target instead of calling `next()`.

## Auth

`src/stores/auth.js` posts to `/auth/login` and stores `accessToken`, `refreshToken` and the serialized `user` in `localStorage`. `init()` rehydrates them, `logout()` clears them. `isAuthenticated` is simply the presence of an access token.

Demo accounts (also offered as one-tap buttons on the login screen):

| Email | Password |
|-------|----------|
| `cura1@mail.com` | `cura123` |
| `cura2@mail.com` | `cura123` |

## Data flow

- `src/stores/order.js` — `fetchOrders()`, `fetchOrderById(id)`, `updateStatus(id, status)`, plus `acceptOrder` / `completeOrder` shortcuts. Every request sends `Authorization: Bearer <accessToken>`; the API base URL is hard-coded to `http://localhost:3000`.
- `src/stores/location.js` — wraps `navigator.geolocation.watchPosition` into `startTracking()` / `stopTracking()` with `latitude` and `longitude` refs.
- `src/stores/socket.js` — connects to `ws://localhost:3000/ws`, authenticates, subscribes to the `orders` channel, reconnects every 3 s after a close, and refetches orders on `new_order`, `order_updated` and `order_cancelled`. `sendLocationUpdate(orderId, lat, lng)` publishes courier position for the active delivery.

Backend broadcasts that feed this: `broadcast('new_order' | 'order_updated' | 'order_cancelled', order)` in `backend/src/routes/orders.ts`, and `broadcastToUser(..., 'order_updated', ...)` from the Stripe webhook in `backend/src/routes/payments.ts`. The WebSocket envelope is `{ type, data }` and `socket.js` reads `message.type` directly.

## Screens

### Orders (`/orders`)

App bar with online/syncing chip, manual refresh and an avatar shortcut to the profile. Three stat tiles (Available / Active / Completed) mirror the filter tabs. Each card shows the short order id, delivery address (clamped to two lines), item summary, relative "time ago", item status chip and total. Pull-free auto refresh every 15 s. Skeleton cards while the first request is in flight; error banner with a retry action; empty state per tab.

Tabs filter on `deliveryType === 'delivery'` and status: `ready` → Available, `on_the_way` → Active, `delivered` → Completed. On load the view jumps to Active or Completed when Available is empty.

### Order detail (`/orders/:id`)

Status stepper (Ready → On the way → Delivered), delivery address block, customer phone with a `tel:` call button, payment line, item list with per-line totals, and an order total. A sticky bottom action bar offers **Accept & pick up** (`ready` → `on_the_way`) or **Mark as delivered** (`on_the_way` → `delivered`), with an inline spinner while the PATCH is in flight. Delivered and cancelled orders get a tonal banner instead of the stepper. Polls the order every 15 s.

### Map (`/map`)

Full-height Leaflet map with a floating app bar (tracking state + live/offline chip) and a bottom card that shows the active delivery or an honest "No active delivery" state. A custom `divIcon` marker follows `locationStore`; when a delivery is `on_the_way`, each position update is also sent over the socket. Tracking stops on unmount.

### Profile (`/profile`)

Avatar hero with name, email and role chip; Delivered and On-the-way counters derived from the loaded orders; account rows (email, courier id, account type); sign-out button.

### Login (`/login`)

Branded full-height screen with the app mark, email/password form (native validation, autocomplete hints), inline error alert, and demo-account buttons that prefill credentials.

## Design system

`src/style.css` holds the whole visual language as Tailwind 4 `@theme` tokens plus component classes:

- **Color** — Google Blue `#0b57d0` primary, tonal containers (`#d3e3fd`, `#e8f0fe`), surface `#f7f9fc`, outline variants, and success/warning/error tonal pairs.
- **Type** — Roboto (400/500/700) loaded from Google Fonts with preconnect.
- **Components** — `.app-bar`, `.icon-btn`, `.card` (24 px radius), `.btn` + `.btn-filled` / `.btn-tonal` / `.btn-outline` / `.btn-success` (pill shape), `.field`, `.status-*` chips, `.stat-tile`, `.bottom-nav` with an active indicator pill, `.skeleton` shimmer, `.spinner` built on a native indeterminate `<progress>`.
- **Accessibility** — `--target-size` is 24 px and grows to 44 px under `@media (pointer: coarse)`; focus rings are always visible; `prefers-reduced-motion` slows the spinner and disables the shimmer.
- **Safe areas** — `viewport-fit=cover` in `index.html` plus `env(safe-area-inset-*)` padding on the app bar, bottom nav, sticky action bar and map overlays.

Icons are inline SVG (stroke, 24×24 grid) — no icon font and no emoji. The bottom navigation is the only route switcher; order detail and profile are reached from the app bar or a list item.

## PWA

`vite.config.js` registers a manifest (name "Delivery Courier", standalone, portrait, theme/background `#f7f9fc`) with 192 and 512 px icons. `index.html` declares theme color, `viewport-fit=cover`, mobile-web-app-capable and the Roboto font links.

## Known limitations

- `src/stores/order.js` does not retry a request after `401`; an expired token shows "Failed to load orders" until the user signs out. A refresh call exists in the auth store but is not wired into the request path.
- Geolocation only works on `localhost` or HTTPS; on plain HTTP over LAN the map shows "Location tracking is off".
- Order data is the full `/orders` list, so counters in the profile count every loaded order, not only the signed-in courier's.
- `tailwind.config.js` is unused leftover config for Tailwind 4; the actual theme lives in `src/style.css`.
