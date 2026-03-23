import { PUBLIC_API_URL } from '$env/static/public';

export const API_URL = PUBLIC_API_URL || 'http://localhost:3000';

function getAuthHeader(): Record<string, string> {
	if (typeof window === 'undefined') return {};
	const token = localStorage.getItem('accessToken');
	return token ? { 'Authorization': `Bearer ${token}` } : {};
}

export async function apiFetch<T>(
	endpoint: string,
	options?: RequestInit
): Promise<{ data: T | null; error: string | null; status: number }> {
	try {
		const res = await fetch(`${API_URL}${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...getAuthHeader(),
				...options?.headers,
			},
			credentials: 'include',
		});

		const data = await res.json();

		if (!res.ok) {
			return {
				data: null,
				error: data.error || 'Something went wrong',
				status: res.status,
			};
		}

		return { data, error: null, status: res.status };
	} catch (error) {
		console.error('API fetch error:', error);
		return {
			data: null,
			error: error instanceof Error ? error.message : 'Network error',
			status: 0,
		};
	}
}

// Auth
export async function login(email: string, password: string) {
	return apiFetch('/auth/login', {
		method: 'POST',
		body: JSON.stringify({ email, password }),
	});
}

export async function register(
	name: string,
	email: string,
	password: string,
	phone?: string,
	address?: string
) {
	return apiFetch('/auth/register', {
		method: 'POST',
		body: JSON.stringify({ name, email, password, phone, address }),
	});
}

export async function logout() {
	// Clear cookies on backend side if needed
	return { data: null, error: null, status: 200 };
}

// Products
export async function getProducts() {
	return apiFetch<any[]>('/products');
}

export async function getProduct(slug: string) {
	return apiFetch<any>(`/products/${slug}`);
}

// Categories
export async function getCategories() {
	return apiFetch<any[]>('/categories');
}

export async function getCategory(slug: string) {
	return apiFetch<any>(`/categories/${slug}`);
}

// Cart
export async function getCart() {
	return apiFetch<any>('/cart');
}

export async function addToCart(productId: string, quantity: number) {
	return apiFetch('/cart/items', {
		method: 'POST',
		body: JSON.stringify({ productId, quantity }),
	});
}

export async function updateCartItem(itemId: string, quantity: number) {
	return apiFetch(`/cart/items/${itemId}`, {
		method: 'PATCH',
		body: JSON.stringify({ quantity }),
	});
}

export async function removeFromCart(itemId: string) {
	return apiFetch(`/cart/items/${itemId}`, { method: 'DELETE' });
}

export async function clearCart() {
	return apiFetch('/cart', { method: 'DELETE' });
}

// Orders
export async function getMyOrders() {
	return apiFetch<any[]>('/orders/my');
}

export async function getOrder(id: string) {
	return apiFetch<any>(`/orders/${id}`);
}

export async function createOrder(orderData: any) {
	return apiFetch('/orders', {
		method: 'POST',
		body: JSON.stringify(orderData),
	});
}

// User
export async function getCurrentUser() {
	return apiFetch<any>('/users/me');
}

export async function updateCurrentUser(data: any) {
	return apiFetch('/users/me', {
		method: 'PATCH',
		body: JSON.stringify(data),
	});
}
