import { writable } from 'svelte/store';
import { getCart } from '$lib/api';

const { subscribe, set } = writable(0);

export const cartCount = {
	subscribe,
	set,
	reset: () => set(0)
};

export async function refreshCartCount(): Promise<number> {
	if (typeof window === 'undefined') return 0;

	const token = localStorage.getItem('accessToken');
	if (!token) {
		set(0);
		return 0;
	}

	const res = await getCart();
	if (res.data && Array.isArray(res.data.items)) {
		const count = res.data.items.reduce(
			(total: number, item: { quantity: number }) => total + item.quantity,
			0
		);
		set(count);
		return count;
	}

	set(0);
	return 0;
}
