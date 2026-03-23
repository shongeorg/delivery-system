# Так. Vue.js + PWA — дуже логічний стек для кур’єра.

Причини
Мобільність
PWA → оффлайн, push, home screen
без необхідності нативного застосунку
швидкий доступ на телефоні кур’єра
Vue.js
простий і швидкий для маленького “одностраничного” застосунку
Composition API → легка реактивність для карт, маршруту, позицій
хороша экосистема (Vue Router, Pinia)
Realtime
WebSocket для оновлення статусу замовлень
оновлення місцезнаходження кур’єра
push notifications через PWA
Карти
Leaflet + OpenStreetMap
відстеження позиції кур’єра
маршрут доставки
Offline / Network
кеш замовлень
якщо зв’язок відсутній → локальний кеш, синхронізація після online

Специфікації для бекенду та фронтенду зрозумілі. Оскільки основний проект використовує Hono та SvelteKit, кур'єрський застосунок має бути максимально легким, швидким та орієнтованим на роботу "в полі" (мобільні пристрої, геолокація, офлайн-сповіщення).

Ось специфікація для **Courier App**:

---

# 📦 Food Delivery Courier App Specification (Vue 3 + Vite + PWA + Tailwind)

## 1. Stack

- **Framework:** Vue 3 (Composition API)
- **Build Tool:** Vite
- **PWA:** `@vite-pwa/plugin` (Service Workers, Offline support, Push notifications)
- **State Management:** Pinia
- **Styling:** TailwindCSS + Headless UI
- **Maps/Geoloc:** Leaflet + Browser Geolocation API
- **API:** REST (Hono backend)
- **Realtime:** WebSocket (для статусів та чату)

---

## 2. Core Features

- **PWA Capabilities:** встановлення на робочий стіл, робота при слабкому сигналі, Push-повідомлення про нові замовлення.
- **Geotracking:** постійна передача координат кур'єра на бекенд через WebSocket, коли замовлення в статусі `on_the_way`.
- **Order Management:** зміна статусів замовлення (`ready` → `on_the_way` → `delivered`).
- **Map Navigation:** побудова маршруту від поточного місця до закладу та до клієнта.

---

## 3. Routing

- `/` — Авторизація (Login)
- `/orders` — Список доступних та активних замовлень
- `/orders/[id]` — Деталі замовлення + Керування статусом
- `/map` — Активна карта доставки
- `/profile` — Статус кур'єра (Online/Offline), статистика, налаштування

---

## 4. State Management (Pinia)

### `authStore`
- Дані кур'єра
- JWT токени

### `orderStore`
- Список активних замовлень
- Поточне замовлення в роботі

### `locationStore`
- Поточні координати кур'єра
- Стан WebSocket з’єднання для трекінгу

---

## 5. PWA Configuration

```ts
pwa: {
  manifest: {
    name: 'Delivery Courier',
    short_name: 'Courier',
    theme_color: '#ffffff',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}']
  }
}
```

---

## 6. Geolocation Logic

### Tracking Service
- Використання `navigator.geolocation.watchPosition`.
- Передача даних через WebSocket:
```json
{
  "type": "courier_location_update",
  "orderId": "uuid",
  "lat": 48.45,
  "lng": 34.98
}
```

---

## 7. Pages & UI

### Dashboard (Orders List)
- Перемикач "В мережі / Офлайн".
- Картки замовлень: адреса, відстань до закладу, час очікування.
- Кнопка "Прийняти замовлення".

### Order Details
- Список товарів (чекліст для перевірки перед виїздом).
- Кнопка швидкого виклику клієнта.
- Кнопка "Змінити статус" (динамічна: Взяти в роботу -> Доставлено).

### Map View
- Відображення точки призначення.
- Маркер кур'єра, що рухається.
- Інтеграція з Google/Apple Maps для зовнішньої навігації (через `geo:` лінки).

---

## 8. Realtime Events (WebSocket)

- `new_order` — Push-повідомлення кур'єрам у радіусі дії.
- `order_cancelled` — Миттєве видалення замовлення зі списку.
- `chat_message` — Повідомлення від клієнта або адміністратора.

---

## 9. Security & Roles

- Guard на рівні роутера: доступ лише для користувачів з `role: 'courier'`.
- Обов'язкове HTTPS для роботи Geolocation API та PWA.

---

## 10. Core Principle (Invisible Work)

- Автоматичне перепідключення WebSocket.
- Збереження стану замовлення в `localStorage` на випадок перезавантаження сторінки.
- Мінімалістичний інтерфейс: великі кнопки, контрастні кольори (зручно використовувати на ходу).

---

📦 Courier 1:
Email: cura1@mail.com
Password: cura123
Role: courier
ID: 6201f8f6-8c0a-4fa4-8a8a-56dd4da278df
📦 Courier 2:
Email: cura2@mail.com
Password: cura123
Role: courier
ID: bb5574c0-16e5-4eb7-95cc-df29b3e22af2