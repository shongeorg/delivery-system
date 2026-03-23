import { writable } from 'svelte/store';

function createSocketStore() {
	const { subscribe, set, update } = writable<WebSocket | null>(null);

	return {
		subscribe,
		connect: (url: string) => {
			const ws = new WebSocket(url);

			ws.onopen = () => {
				console.log('WebSocket connected');
			};

			ws.onclose = () => {
				console.log('WebSocket disconnected');
				set(null);
			};

			ws.onerror = (error) => {
				console.error('WebSocket error:', error);
			};

			set(ws);
			return ws;
		},
		disconnect: () => {
			subscribe((ws) => {
				if (ws) {
					ws.close();
				}
			})();
			set(null);
		},
		send: (data: any) => {
			subscribe((ws) => {
				if (ws && ws.readyState === WebSocket.OPEN) {
					ws.send(JSON.stringify(data));
				}
			})();
		},
		onMessage: (callback: (data: any) => void) => {
			subscribe((ws) => {
				if (ws) {
					ws.onmessage = (event) => {
						callback(JSON.parse(event.data));
					};
				}
			})();
		},
	};
}

export const socketStore = createSocketStore();
