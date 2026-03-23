👑 Food Delivery Owner Panel Specification (Angular + RxJS + Tailwind)

1. Stack
   Framework: Angular 17+ (Signals/Standalone Components)

State Management: RxJS + Signals (для реактивності даних)

UI Library: TailwindCSS + Angular Material (для складних таблиць та діалогів)

Forms: Angular Reactive Forms

Charts: Ngx-charts / Chart.js (візуалізація фінансів)

API: REST (Hono backend)

2. Core Modules
   2.1. Restaurant Profile (Branding)
   Редагування глобальних налаштувань закладу:

Identity: Назва ресторану, завантаження Logo та Cover image.

Location: Адреса (інтеграція з Leaflet для встановлення координат), телефон, робочі години.

System: Налаштування валюти, податків та вартості доставки.

2.2. Human Resources (HRM)
Повний контроль над персоналом та клієнтами:

User Management: Таблиця з усіма користувачами (owner, admin, chef, courier, customer, driver, cleaner).

Role Control: Зміна ролей "на льоту", блокування акаунтів, видалення.

Payroll System: - Поля в профілі працівника: base_salary, bonus_percentage.

Кнопка "Нарахувати премію".

Історія виплат.

2.3. Finance & Cash Flow
Модуль моніторингу грошових потоків:

Revenue: Список усіх замовлень (orders) з фільтрацією за період.

Expenses: Витрати на закупівлі (inventory / supplies).

Net Profit: Автоматичний розрахунок: Дохід - (Закупівлі + Зарплати).

Analytics: Графіки замовлень та прибутку.

3. Architecture & Security
   Guards
   OwnerGuard: Перевірка ролі owner. Якщо роль інша — редирект на /403.

Interceptors
AuthInterceptor: Додає Authorization: Bearer <token> до кожного запиту.

ErrorInterceptor: Обробка 401 (refresh token) та 403 помилок.

4. Routing Structure
   TypeScript
   const routes: Routes = [
   { path: 'login', component: LoginComponent },
   {
   path: 'admin',
   component: AdminLayoutComponent,
   canActivate: [OwnerGuard],
   children: [
   { path: 'dashboard', component: DashboardComponent },
   { path: 'restaurant-settings', component: SettingsComponent },
   { path: 'staff', component: StaffListComponent },
   { path: 'staff/:id', component: StaffDetailsComponent },
   { path: 'customers', component: CustomerListComponent },
   { path: 'finances', component: FinanceComponent },
   { path: 'audit-logs', component: LogsComponent }
   ]
   }
   ];
5. Components UI
   FinanceCard: Віджет з поточним балансом та профітом за добу.

UserActionMenu: Випадаюче меню для швидкої зміни ролі або видалення юзера.

SalaryModal: Форма для редагування фінансових умов працівника.

FileUploader: Кастомний компонент для Logo/Cover з прев'ю.

6. Features & Logic
   Slug Management: Оунер може вручну змінити slug ресторану або юзера (якщо це передбачено бізнес-логікою).

Search & Filter: Потужний пошук по юзерах (за email, роллю, телефоном).

Audit Logs: Секція, де оунер бачить, хто з адмінів змінював ціни або видаляв продукти.

7. Folder Structure
   Plaintext
   src/
   app/
   core/ # Guards, Interceptors, Services (auth, api)
   shared/ # Components (Button, Table, Modal), Pipes, Directives
   features/ # Modules (hr, settings, finance, dashboard)
   store/ # Signals-based state management
