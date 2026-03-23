```md
# 🍕 Food Delivery Frontend Specification (SvelteKit + Tailwind + OpenStreetMap + Leaflet)

---

## 1. Stack

- Framework: SvelteKit
- Styling: TailwindCSS
- Maps: Leaflet
- Map Data: OpenStreetMap
- Geocoding: Nominatim
- Routing (optional): OSRM
- State: Svelte stores
- API: REST (Hono backend)
- Realtime: WebSocket
- Auth: JWT (cookies)

---

## 2. Architecture

- Frontend (SvelteKit) ←→ Backend (Hono API)
- SSR → initial render
- CSR → interaction
- WebSocket → realtime

---

## 3. Routing

```

/                 → Home
/login
/register
/catalog
/catalog/[slug]
/cart
/checkout
/orders
/profile/[slug]

/admin/*

````

---

## 4. Layouts

### Root
- header
- footer
- user state

### Admin
- sidebar
- role guard

---

## 5. Auth

- login/register → API
- JWT → cookies
- `hooks.server.ts` → user in locals

---

## 6. Stores

```ts
userStore
cartStore
socketStore
mapStore
````

---

## 7. API Layer

```ts
fetch(API_URL, {
  credentials: 'include'
})
```

---

## 8. WebSocket

### Events

* order_updated
* cart_updated
* new_message
* courier_location_update

---

## 9. Pages

### Home

* категории
* продукты

### Catalog

* фильтры (категории, теги)

### Product

* инфо
* ингредиенты
* отзывы
* add to cart

### Cart

* список
* изменение количества

### Checkout

* address
* phone
* доставка / самовывоз
* оплата

### Orders

* список
* realtime статус

### Profile

* avatar
* address
* phone

---

## 10. Admin

* Users
* Products
* Categories
* Tags
* Inventory
* Orders
* Reviews
* Chat

---

## 11. Cart Sync

* REST → source
* WebSocket → updates

---

## 12. Slug Routing

```
/catalog/pizza
/profile/john
```

---

## 13. Maps (Leaflet + OSM)

---

### Установка

```bash
npm install leaflet
```

---

### Базовая карта

```ts
import L from 'leaflet'

onMount(() => {
  const map = L.map('map').setView([48.45, 34.98], 13)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap'
  }).addTo(map)
})
```

---

## 14. Использование карты

### В Checkout

* показать текущий адрес
* возможность выбрать точку на карте
* обновление формы (address + coords)

---

### В Orders

* показать точку доставки
* статус доставки

---

### Для курьера

* его позиция
* движение по карте

---

## 15. Геокодинг (Nominatim)

### Адрес → координаты

```ts
fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json`)
```

---

### Координаты → адрес

```ts
fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
```

---

## 16. Realtime Tracking

### WebSocket событие

```json
{
  "type": "courier_location_update",
  "lat": 48.45,
  "lng": 34.98
}
```

---

### Обновление карты

```ts
marker.setLatLng([lat, lng])
```

---

## 17. Routing (опционально)

### OSRM

* построение маршрута
* ETA

---

## 18. UI Components

* Button
* Input
* Card
* Modal
* Table
* MapContainer

---

## 19. Forms

* login/register
* checkout
* CRUD формы

---

## 20. Validation

* client (Zod optional)
* server (mandatory)

---

## 21. Notifications

* toast
* WebSocket trigger

---

## 22. Error Handling

```ts
try {} catch(e) {}
```

---

## 23. SSR

* initial data:

  * user
  * products
  * categories

---

## 24. File Structure

```
src/
  routes/
  lib/
    components/
    stores/
    api/
    map/
```

---

## 25. Env

```
PUBLIC_API_URL=
PUBLIC_WS_URL=
```

---

## 26. Build

* adapter-node / auto

---

## 27. Core Principle

* backend → логика
* frontend → UI + realtime + карта

```
```
