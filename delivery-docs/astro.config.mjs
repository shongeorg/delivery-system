// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	integrations: [
		starlight({
			title: 'Food Delivery System',
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/withastro/starlight' }],
			locales: {
				en: { label: 'English', lang: 'en' },
				uk: { label: 'Українська', lang: 'uk' },
			},
			defaultLocale: 'en',
			sidebar: [
				{
					label: 'Overview',
					translations: { uk: 'Огляд' },
					items: [
						{ label: 'Introduction', slug: 'introduction', translations: { uk: 'Вступ' } },
						{ label: 'Architecture', slug: 'architecture', translations: { uk: 'Архітектура' } },
						{ label: 'Quick Start', slug: 'quick-start', translations: { uk: 'Швидкий старт' } },
					],
				},
				{
					label: 'Backend API',
					translations: { uk: 'Backend API' },
					items: [
						{ label: 'Authentication', slug: 'api/auth', translations: { uk: 'Авторизація' } },
						{ label: 'Users', slug: 'api/users', translations: { uk: 'Користувачі' } },
						{ label: 'Catalog (Products, Categories, Tags)', slug: 'api/catalog', translations: { uk: 'Каталог' } },
						{ label: 'Cart', slug: 'api/cart', translations: { uk: 'Кошик' } },
						{ label: 'Orders', slug: 'api/orders', translations: { uk: 'Замовлення' } },
						{ label: 'Payments', slug: 'api/payments', translations: { uk: 'Платежі' } },
						{ label: 'Chats', slug: 'api/chats', translations: { uk: 'Чати' } },
						{ label: 'Geo', slug: 'api/geo', translations: { uk: 'Гео' } },
						{ label: 'Inventory', slug: 'api/inventory', translations: { uk: 'Склад' } },
						{ label: 'Reviews', slug: 'api/reviews', translations: { uk: 'Відгуки' } },
						{ label: 'Owner Panel', slug: 'api/owner', translations: { uk: "Панель власника" } },
						{ label: 'Calls (WebRTC)', slug: 'api/calls', translations: { uk: 'Дзвінки (WebRTC)' } },
						{ label: 'Health & OpenAPI', slug: 'api/health', translations: { uk: 'Health & OpenAPI' } },
						{ label: 'Error Codes', slug: 'api/errors', translations: { uk: 'Коди помилок' } },
					],
				},
				{
					label: 'Data Model',
					translations: { uk: 'Модель даних' },
					items: [
						{ label: 'ER Diagram', slug: 'data-model/er', translations: { uk: 'ER-діаграма' } },
						{ label: 'Reference Tables', slug: 'data-model/reference', translations: { uk: 'Довідники' } },
						{ label: 'Orders', slug: 'data-model/orders', translations: { uk: 'Замовлення' } },
						{ label: 'Cart, Reviews, Chats', slug: 'data-model/cart-reviews-chats', translations: { uk: 'Кошик, відгуки, чати' } },
						{ label: 'Tracking', slug: 'data-model/tracking', translations: { uk: 'Трекінг' } },
						{ label: 'Owner Panel Tables', slug: 'data-model/owner', translations: { uk: 'Таблиці owner-панелі' } },
						{ label: 'Cascades', slug: 'data-model/cascades', translations: { uk: 'Каскади' } },
					],
				},
				{
					label: 'Realtime (WebSocket)',
					translations: { uk: 'Realtime (WebSocket)' },
					items: [
						{ label: 'Connection & Protocol', slug: 'realtime/connection', translations: { uk: 'Підключення і протокол' } },
						{ label: 'Client → Server Messages', slug: 'realtime/client-to-server', translations: { uk: 'Клієнт → Сервер' } },
						{ label: 'Server → Client Events', slug: 'realtime/server-to-client', translations: { uk: 'Сервер → Клієнт' } },
						{ label: 'Channels', slug: 'realtime/channels', translations: { uk: 'Канали' } },
						{ label: 'Client Behaviour & Fallbacks', slug: 'realtime/clients-fallbacks', translations: { uk: 'Поведінка клієнтів і фолбеки' } },
						{ label: 'Security & Limitations', slug: 'realtime/security', translations: { uk: 'Безпека і обмеження' } },
					],
				},
				{
					label: 'Order Lifecycle',
					translations: { uk: 'Життєвий цикл замовлення' },
					items: [
						{ label: 'Statuses & Transitions', slug: 'order-lifecycle/statuses', translations: { uk: 'Статуси й переходи' } },
						{ label: 'Courier Rules', slug: 'order-lifecycle/courier-rules', translations: { uk: 'Правила кур\'єра' } },
						{ label: 'Cancellation', slug: 'order-lifecycle/cancellation', translations: { uk: 'Скасування' } },
						{ label: 'Role Permissions', slug: 'order-lifecycle/permissions', translations: { uk: 'Права ролей' } },
						{ label: 'Payment Flow', slug: 'order-lifecycle/payment', translations: { uk: 'Оплата' } },
						{ label: 'Courier Flow', slug: 'order-lifecycle/courier-flow', translations: { uk: 'Потік кур\'єра' } },
						{ label: 'Customer View', slug: 'order-lifecycle/customer-view', translations: { uk: 'Вигляд клієнта' } },
						{ label: 'Edge Cases', slug: 'order-lifecycle/edge-cases', translations: { uk: 'Крайові випадки' } },
					],
				},
				{
					label: 'Tracking & Chat',
					translations: { uk: 'Трекінг і чат' },
					items: [
						{ label: 'Data Flow', slug: 'tracking-chat/data-flow', translations: { uk: 'Потік даних' } },
						{ label: 'Customer Location', slug: 'tracking-chat/customer-location', translations: { uk: 'Точка клієнта' } },
						{ label: 'Courier Route', slug: 'tracking-chat/courier-route', translations: { uk: 'Маршрут кур\'єра' } },
						{ label: 'Customer Tracking Page', slug: 'tracking-chat/customer-tracking', translations: { uk: 'Сторінка трекінгу клієнта' } },
						{ label: 'Tracking Endpoints', slug: 'tracking-chat/endpoints', translations: { uk: 'Ендпоінти трекінгу' } },
						{ label: 'Order Chat', slug: 'tracking-chat/order-chat', translations: { uk: 'Чат замовлення' } },
						{ label: 'Chat UI', slug: 'tracking-chat/chat-ui', translations: { uk: 'UI чату' } },
						{ label: 'Verification Results', slug: 'tracking-chat/verification', translations: { uk: 'Результати перевірки' } },
					],
				},
				{
					label: 'Frontend Apps',
					translations: { uk: 'Frontend-застосунки' },
					items: [
						{ label: 'Frontend (SvelteKit)', slug: 'apps/frontend', translations: { uk: 'Frontend (SvelteKit)' } },
						{ label: 'Courier App (Vue PWA)', slug: 'apps/courier', translations: { uk: 'Courier App (Vue PWA)' } },
						{ label: 'Chef Panel (React)', slug: 'apps/chef', translations: { uk: 'Chef Panel (React)' } },
						{ label: 'Owner Panel (React)', slug: 'apps/owner', translations: { uk: 'Owner Panel (React)' } },
					],
				},
				{
					label: 'Owner Panel',
					translations: { uk: 'Панель власника' },
					items: [
						{ label: 'Finances', slug: 'owner/finances', translations: { uk: 'Фінанси' } },
						{ label: 'Expenses', slug: 'owner/expenses', translations: { uk: 'Витрати' } },
						{ label: 'Staff & Payroll', slug: 'owner/staff', translations: { uk: 'Персонал і зарплати' } },
						{ label: 'Kitchen', slug: 'owner/kitchen', translations: { uk: 'Кухня' } },
						{ label: 'Settings & Audit', slug: 'owner/settings', translations: { uk: 'Налаштування і аудит' } },
					],
				},
				{
					label: 'User Stories',
					translations: { uk: 'User Stories' },
					items: [
						{ label: 'Customer', slug: 'user-stories/customer', translations: { uk: 'Клієнт' } },
						{ label: 'Courier', slug: 'user-stories/courier', translations: { uk: 'Кур\'єр' } },
						{ label: 'Chef Panel', slug: 'user-stories/chef', translations: { uk: 'Кухня' } },
						{ label: 'Owner Panel', slug: 'user-stories/owner', translations: { uk: 'Власник' } },
						{ label: 'Cross-cutting Scenarios', slug: 'user-stories/e2e', translations: { uk: 'Наскрізні сценарії' } },
						{ label: 'Gaps & Limitations', slug: 'user-stories/gaps', translations: { uk: 'Пробіли й обмеження' } },
					],
				},
				{
					label: 'Development',
					translations: { uk: 'Розробка' },
					items: [
						{ label: 'Testing', slug: 'dev/testing', translations: { uk: 'Тестування' } },
						{ label: 'Environment Variables', slug: 'dev/env', translations: { uk: 'Змінні середовища' } },
						{ label: 'Database Commands', slug: 'dev/database', translations: { uk: 'Команди БД' } },
						{ label: 'Known Issues', slug: 'dev/known-issues', translations: { uk: 'Відомі проблеми' } },
					],
				},
			],
		}),
	],
});