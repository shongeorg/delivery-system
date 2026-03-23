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
	// Try to restore user from localStorage on init
	const storedUser = typeof window !== 'undefined' 
		? localStorage.getItem('user') 
		: null;
	const initialUser: User | null = storedUser ? JSON.parse(storedUser) : null;

	const { subscribe, set, update } = writable<User | null>(initialUser);

	return {
		subscribe,
		set: (user: User | null) => {
			if (user) {
				localStorage.setItem('user', JSON.stringify(user));
			} else {
				localStorage.removeItem('user');
			}
			set(user);
		},
		update,
		login: (user: User) => {
			localStorage.setItem('user', JSON.stringify(user));
			set(user);
		},
		logout: () => {
			localStorage.removeItem('user');
			set(null);
		},
	};
}

export const userStore = createUserStore();
