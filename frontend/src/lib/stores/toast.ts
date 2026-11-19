import { writable } from 'svelte/store';

export type ToastType = 'success' | 'error';

interface ToastState {
	message: string;
	type: ToastType;
	visible: boolean;
}

const store = writable<ToastState>({ message: '', type: 'success', visible: false });

let timer: ReturnType<typeof setTimeout> | undefined;

export const toast = {
	subscribe: store.subscribe
};

export function showToast(message: string, type: ToastType = 'success') {
	store.set({ message, type, visible: true });

	if (timer) clearTimeout(timer);
	timer = setTimeout(() => {
		store.update((state) => ({ ...state, visible: false }));
	}, 3000);
}
