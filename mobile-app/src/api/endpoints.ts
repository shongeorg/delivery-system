import { request, qs } from './client';
import type {
  AuthResponse,
  User,
  Role,
  Category,
  Tag,
  Product,
  ProductsResponse,
  CategoryResponse,
  CartResponse,
  Order,
  OrderStatus,
  CreateOrderPayload,
  Tracking,
  Chat,
  ChatMessage,
  InventoryItem,
  Review,
  GeocodeResult,
  PaymentIntent,
  OwnerOverview,
  StaffMember,
  SalaryPayload,
  PayrollResponse,
  PayrollPayment,
  FinanceResponse,
  Expense,
  OwnerKitchen,
  RestaurantSettings,
  AuditLogEntry,
  CallPresence,
} from './types';

/* ------------------------------- Auth ------------------------------- */
export const login = (email: string, password: string) =>
  request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password }, auth: false });

export const register = (payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}) => request<AuthResponse>('/auth/register', { method: 'POST', body: payload, auth: false });

/* ------------------------------- Users ------------------------------- */
export const getMe = () => request<User>('/users/me');
export const updateMe = (payload: Partial<Pick<User, 'name' | 'phone' | 'address' | 'cover'>>) =>
  request<User>('/users/me', { method: 'PATCH', body: payload });
export const getUserBySlug = (slug: string) => request<Partial<User>>(`/users/${slug}`, { auth: false });
export const setUserRole = (id: string, role: Role) =>
  request<User>(`/users/${id}/role`, { method: 'PATCH', body: { role } });

/* ---------------------------- Categories ---------------------------- */
export const listCategories = () => request<Category[]>('/categories', { auth: false });
export const getCategory = (slug: string, page = 1, limit = 20) =>
  request<CategoryResponse>(`/categories/${slug}${qs({ page, limit })}`, { auth: false });
export const createCategory = (payload: Partial<Category>) =>
  request<Category>('/categories', { method: 'POST', body: payload });
export const updateCategory = (id: string, payload: Partial<Category>) =>
  request<Category>(`/categories/${id}`, { method: 'PATCH', body: payload });
export const deleteCategory = (id: string) =>
  request<{ success: boolean }>(`/categories/${id}`, { method: 'DELETE' });

/* ------------------------------ Products ------------------------------ */
export const listProducts = (page = 1, limit = 20) =>
  request<ProductsResponse>(`/products${qs({ page, limit })}`, { auth: false });
export const getProduct = (slug: string) =>
  request<Product>(`/products/${slug}`, { auth: false });
export const createProduct = (payload: Record<string, unknown>) =>
  request<Product>('/products', { method: 'POST', body: payload });
export const updateProduct = (id: string, payload: Record<string, unknown>) =>
  request<Product>(`/products/${id}`, { method: 'PATCH', body: payload });
export const deleteProduct = (id: string) =>
  request<{ success: boolean }>(`/products/${id}`, { method: 'DELETE' });

/* -------------------------------- Tags -------------------------------- */
export const listTags = () => request<Tag[]>('/tags', { auth: false });
export const getTag = (slug: string) => request<Tag & { products: Product[] }>(`/tags/${slug}`, { auth: false });
export const createTag = (name: string) => request<Tag>('/tags', { method: 'POST', body: { name } });
export const deleteTag = (id: string) =>
  request<{ success: boolean }>(`/tags/${id}`, { method: 'DELETE' });

/* -------------------------------- Cart -------------------------------- */
export const getCart = () => request<CartResponse>('/cart');
export const addCartItem = (productId: string, quantity = 1) =>
  request<{ success: boolean }>('/cart/items', { method: 'POST', body: { productId, quantity } });
export const updateCartItem = (itemId: string, quantity: number) =>
  request<{ success: boolean }>(`/cart/items/${itemId}`, { method: 'PATCH', body: { quantity } });
export const removeCartItem = (itemId: string) =>
  request<{ success: boolean }>(`/cart/items/${itemId}`, { method: 'DELETE' });
export const clearCart = () => request<{ success: boolean }>('/cart', { method: 'DELETE' });

/* ------------------------------- Orders ------------------------------- */
export const listOrders = (status?: OrderStatus) =>
  request<Order[]>(`/orders${qs({ status })}`);
export const listMyOrders = () => request<Order[]>('/orders/my');
export const getOrder = (id: string) => request<Order>(`/orders/${id}`);
export const getOrderTracking = (id: string) => request<Tracking>(`/orders/${id}/tracking`);
export const createOrder = (payload: CreateOrderPayload) =>
  request<Order>('/orders', { method: 'POST', body: payload });
export const updateOrderStatus = (id: string, status: OrderStatus) =>
  request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: { status } });
export const updateOrderLocation = (id: string, lat: number, lng: number) =>
  request<{ orderId: string; courierId: string; lat: number; lng: number; updatedAt: string }>(
    `/orders/${id}/location`,
    { method: 'PUT', body: { lat, lng } },
  );
export const cancelOrder = (id: string) =>
  request<Order>(`/orders/${id}/cancel`, { method: 'POST' });

/* -------------------------------- Chats -------------------------------- */
export const getOrderChat = (orderId: string) => request<Chat>(`/chats/order/${orderId}`);
export const getOrderMessages = (orderId: string) =>
  request<ChatMessage[]>(`/chats/order/${orderId}/messages`);
export const sendOrderMessage = (orderId: string, text: string) =>
  request<ChatMessage>(`/chats/order/${orderId}/messages`, { method: 'POST', body: { text } });

/* --------------------------------- Geo --------------------------------- */
export const geocode = (address: string) =>
  request<GeocodeResult>('/geo/geocode', { method: 'POST', body: { address } });

/* ------------------------------ Payments ------------------------------ */
export const createPaymentIntent = (orderId: string) =>
  request<PaymentIntent>('/payments/create-intent', { method: 'POST', body: { orderId } });
export const confirmPayment = (orderId: string, paymentIntentId: string) =>
  request<{ success: boolean; order: Order }>('/payments/confirm', {
    method: 'POST',
    body: { orderId, paymentIntentId },
  });

/* ------------------------------- Reviews ------------------------------- */
export const listProductReviews = (productId: string) =>
  request<Review[]>(`/reviews/product/${productId}`, { auth: false });
export const createReview = (payload: { productId: string; rating: number; text: string }) =>
  request<Review>('/reviews', { method: 'POST', body: payload });
export const updateReview = (id: string, payload: { rating?: number; text?: string }) =>
  request<Review>(`/reviews/${id}`, { method: 'PATCH', body: payload });
export const deleteReview = (id: string) =>
  request<{ success: boolean }>(`/reviews/${id}`, { method: 'DELETE' });

/* ------------------------------ Inventory ------------------------------ */
export const listInventory = () => request<InventoryItem[]>('/inventory');
export const getInventoryItem = (slug: string) => request<InventoryItem>(`/inventory/${slug}`);
export const createInventoryItem = (payload: Partial<InventoryItem>) =>
  request<InventoryItem>('/inventory', { method: 'POST', body: payload });
export const updateInventoryQuantity = (id: string, quantity: number) =>
  request<InventoryItem>(`/inventory/${id}/quantity`, { method: 'PATCH', body: { quantity } });
export const deleteInventoryItem = (id: string) =>
  request<{ success: boolean }>(`/inventory/${id}`, { method: 'DELETE' });

/* -------------------------------- Calls -------------------------------- */
export const getCallPresence = (orderId?: string) =>
  request<CallPresence>(`/calls/presence${qs({ orderId })}`);

/* -------------------------------- Owner -------------------------------- */
export const getOwnerOverview = () => request<OwnerOverview>('/owner/overview');
export const listStaff = (search?: string, role?: string) =>
  request<StaffMember[]>(`/owner/staff${qs({ search, role })}`);
export const updateStaff = (
  id: string,
  payload: { name?: string; role?: Role; isBlocked?: boolean; phone?: string },
) => request<StaffMember>(`/owner/staff/${id}`, { method: 'PATCH', body: payload });
export const setStaffSalary = (id: string, payload: SalaryPayload) =>
  request<unknown>(`/owner/staff/${id}/salary`, { method: 'PUT', body: payload });
export const getPayroll = (period?: string) =>
  request<PayrollResponse>(`/owner/payroll${qs({ period })}`);
export const createPayrollPayment = (payload: {
  userId: string;
  amount: number;
  type: 'salary' | 'bonus';
  period?: string;
  note?: string;
}) => request<PayrollPayment>('/owner/payroll', { method: 'POST', body: payload });
export const getFinances = (from?: string, to?: string) =>
  request<FinanceResponse>(`/owner/finances${qs({ from, to })}`);
export const listExpenses = () => request<Expense[]>('/owner/expenses');
export const createExpense = (payload: { title: string; category: string; amount: number; note?: string }) =>
  request<Expense>('/owner/expenses', { method: 'POST', body: payload });
export const deleteExpense = (id: string) =>
  request<{ success: boolean }>(`/owner/expenses/${id}`, { method: 'DELETE' });
export const getOwnerKitchen = () => request<OwnerKitchen>('/owner/kitchen');
export const getSettings = () => request<RestaurantSettings>('/owner/settings');
export const updateSettings = (payload: Partial<RestaurantSettings>) =>
  request<RestaurantSettings>('/owner/settings', { method: 'PATCH', body: payload });
export const getAuditLogs = () => request<AuditLogEntry[]>('/owner/audit-logs');
