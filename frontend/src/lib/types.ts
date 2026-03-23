export interface User {
	id: string;
	name: string;
	slug: string;
	email: string;
	role: 'owner' | 'admin' | 'customer' | 'chef' | 'courier';
	cover?: string | null;
	phone?: string | null;
	address?: string | null;
	isBlockedFromReviews?: boolean;
	createdAt?: string;
}

export interface Category {
	id: string;
	name: string;
	slug: string;
	description?: string | null;
	cover?: string | null;
}

export interface Product {
	id: string;
	name: string;
	slug: string;
	price: string;
	description?: string | null;
	cover?: string | null;
	createdBy?: string | null;
	createdAt?: string | null;
	categories?: Category[];
	tags?: Tag[];
	ingredients?: Ingredient[];
}

export interface Tag {
	id: string;
	name: string;
	slug: string;
}

export interface Ingredient {
	id: string;
	productId: string;
	name: string;
	quantity: string;
	unit: string;
}

export interface CartItem {
	item: {
		id: string;
		cartId: string;
		productId: string;
		quantity: number;
	};
	product: Product;
}

export interface Cart {
	cart: {
		id: string;
		userId: string;
		updatedAt: string;
	} | null;
	items: CartItem[];
}

export interface Order {
	id: string;
	userId: string;
	totalPrice: string;
	status: 'created' | 'paid' | 'cooking' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';
	deliveryType: 'pickup' | 'delivery';
	address?: string | null;
	phone: string;
	paymentType: 'card' | 'cash';
	paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
	createdAt: string;
	items?: OrderItem[];
}

export interface OrderItem {
	id: string;
	orderId: string;
	productId: string;
	quantity: number;
	price: string;
	product?: Product;
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

export interface InventoryItem {
	id: string;
	name: string;
	slug: string;
	quantity: string;
	unit: string;
	cover?: string | null;
	updatedAt: string;
}

export interface Chat {
	id: string;
	userId: string;
	messages?: Message[];
}

export interface Message {
	id: string;
	chatId: string;
	sender: 'user' | 'admin';
	text: string;
	createdAt: string;
}

export interface AuthResponse {
	user: User;
	accessToken: string;
	refreshToken: string;
}
