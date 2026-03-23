import { writable } from 'svelte/store';

interface CartItem {
	item: {
		id: string;
		cartId: string;
		productId: string;
		quantity: number;
	};
	product: {
		id: string;
		name: string;
		slug: string;
		price: string;
		cover?: string | null;
	};
}

interface Cart {
	cart: {
		id: string;
		userId: string;
		updatedAt: string;
	} | null;
	items: CartItem[];
}

function createCartStore() {
	const { subscribe, set, update } = writable<Cart>({ cart: null, items: [] });

	return {
		subscribe,
		set,
		update,
		addItem: (item: CartItem) =>
			update((state) => ({ ...state, items: [...state.items, item] })),
		removeItem: (itemId: string) =>
			update((state) => ({
				...state,
				items: state.items.filter((i) => i.item.id !== itemId),
			})),
		clear: () => set({ cart: null, items: [] }),
	};
}

export const cartStore = createCartStore();
