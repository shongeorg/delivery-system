import { writable } from 'svelte/store';

interface User {
	id: string;
	name: string;
	slug: string;
	email: string;
	role: string;
	cover?: string | null;
	phone?: string | null;
	address?: string | null;
}

function createUserStore() {
	const { subscribe, set, update } = writable<User | null>(null);

	return {
		subscribe,
		set,
		update,
		login: (user: User) => set(user),
		logout: () => set(null),
	};
}

export const userStore = createUserStore();
