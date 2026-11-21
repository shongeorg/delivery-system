export type Role = 'owner' | 'admin' | 'customer' | 'chef' | 'courier';

export interface User {
  id: string;
  name: string;
  slug: string;
  email: string;
  role: Role;
  cover?: string | null;
  phone?: string | null;
  address?: string | null;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  cover?: string | null;
  description?: string | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Ingredient {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: string;
  description?: string | null;
  cover?: string | null;
  categories?: Category[];
  tags?: Tag[];
  ingredients?: Ingredient[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  lastPage: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: Pagination;
}

export interface CategoryResponse {
  category: Category;
  products: Product[];
  pagination: Pagination;
}

export interface CartLineItem {
  id: string;
  cartId: string;
  productId: string;
  quantity: number;
  product: Product;
}

export interface CartResponse {
  cart: { id: string; userId: string; updatedAt: string } | null;
  items: CartLineItem[];
}

export type OrderStatus =
  | 'created'
  | 'paid'
  | 'cooking'
  | 'ready'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export type DeliveryType = 'delivery' | 'pickup';
export type PaymentType = 'card' | 'cash';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  price: string;
  product?: Product | null;
}

export interface Order {
  id: string;
  userId: string;
  totalPrice: string;
  status: OrderStatus;
  deliveryType: DeliveryType;
  address?: string | null;
  phone: string;
  paymentType: PaymentType;
  paymentStatus: string;
  courierId?: string | null;
  lat?: number | null;
  lng?: number | null;
  createdAt: string;
  items?: OrderItem[];
  user?: Pick<User, 'id' | 'name' | 'phone'> | null;
  courier?: Pick<User, 'id' | 'name' | 'phone'> | null;
}

export interface CreateOrderPayload {
  deliveryType: DeliveryType;
  address?: string;
  phone: string;
  paymentType: PaymentType;
  lat?: number;
  lng?: number;
  items: { productId: string; quantity: number }[];
}

export interface Chat {
  id: string;
  userId: string;
  orderId: string | null;
}

export type ChatSender = 'user' | 'admin' | 'courier';

export interface ChatMessage {
  id: string;
  chatId?: string;
  sender: ChatSender;
  text: string;
  createdAt: string;
}

export interface Tracking {
  order: Order;
  client: { lat: number | null; lng: number | null };
  courier: { id: string; name: string; phone?: string | null } | null;
  location: { lat: number; lng: number; updatedAt: string } | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  slug: string;
  quantity: number;
  unit: string;
  cover?: string | null;
  updatedAt: string;
}

export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  text: string;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'slug' | 'cover'>;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

export interface PaymentIntent {
  clientSecret: string;
  paymentIntentId: string;
}

/* ----------------------------- Owner ----------------------------- */

export interface OwnerOverview {
  revenue: { today: number; week: number; month: number; total: number };
  orders: {
    today: number;
    active: number;
    deliveredToday: number;
    total: number;
    averageValue: number;
  };
  finance: { payrollMonth: number; expensesMonth: number; netProfitMonth: number };
  staff: { total: number; byRole: Record<string, number>; blocked: number };
  topProducts: { name: string; quantity: number; revenue: number }[];
  lowStock: InventoryItem[];
  recentOrders: Order[];
}

export interface StaffMember extends User {
  isBlocked: boolean;
  salary?: { baseSalary: number; bonusPercentage: number; currency: string } | null;
}

export interface SalaryPayload {
  baseSalary: number;
  bonusPercentage: number;
  currency?: string;
}

export interface PayrollPayment {
  id: string;
  userId: string;
  amount: number;
  type: 'salary' | 'bonus';
  period?: string | null;
  note?: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'role'>;
}

export interface PayrollResponse {
  payments: PayrollPayment[];
  totals: { salary: number; bonus: number; all: number };
}

export interface FinanceResponse {
  from: string;
  to: string;
  totals: {
    revenue: number;
    payroll: number;
    expenses: number;
    net: number;
    orders: number;
    paidOrders: number;
  };
  series: { date: string; revenue: number; payroll: number; expenses: number; net: number }[];
  expenses: Expense[];
  payrollPayments: PayrollPayment[];
}

export interface Expense {
  id: string;
  title: string;
  category: string;
  amount: number;
  note?: string | null;
  createdAt: string;
}

export interface OwnerKitchen {
  counts: Record<string, number>;
  queue: (Order & { courier?: Pick<User, 'id' | 'name' | 'phone'> | null; waitingMinutes: number })[];
  oldestWaitingMinutes: number;
  lowStock: InventoryItem[];
}

export interface RestaurantSettings {
  id?: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  workingHours?: string | null;
  currency: string;
  taxRate: number;
  deliveryFee: number;
  logo?: string | null;
  cover?: string | null;
}

export interface AuditLogEntry {
  id: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'role'> | null;
}

export interface CallPresence {
  supportOnline: boolean;
  customerOnline?: boolean;
  courierOnline?: boolean;
}

/* ----------------------------- Realtime ----------------------------- */

export interface WsMessage {
  type: string;
  data?: unknown;
  [key: string]: unknown;
}
