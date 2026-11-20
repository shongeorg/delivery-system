<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { PUBLIC_API_URL } from '$env/static/public';
	import {
		API_URL,
		getOrderMessages,
		getOrderTracking,
		sendOrderMessage
	} from '$lib/api';
	import type { Message, OrderTracking } from '$lib/types';
	import type * as Leaflet from 'leaflet';

	const orderId = $derived($page.params.id ?? '');

	const steps = [
		{ id: 'created', label: 'Placed' },
		{ id: 'cooking', label: 'Cooking' },
		{ id: 'ready', label: 'Ready' },
		{ id: 'on_the_way', label: 'On the way' },
		{ id: 'delivered', label: 'Delivered' }
	];

	let tracking = $state<OrderTracking | null>(null);
	let messages = $state<Message[]>([]);
	let loading = $state(true);
	let error = $state('');
	let text = $state('');
	let sending = $state(false);
	let chatError = $state('');
	let mapElement = $state<HTMLDivElement>();
	let map = $state<Leaflet.Map | null>(null);
	let leaflet = $state<typeof import('leaflet') | null>(null);
	let courierMarker: Leaflet.Marker | null = null;
	let clientMarker: Leaflet.Marker | null = null;
	let routeLine: Leaflet.Polyline | null = null;
	let pollTimer: ReturnType<typeof setInterval> | null = null;
	let socket: WebSocket | null = null;
	let socketTimer: ReturnType<typeof setTimeout> | null = null;
	let destroyed = false;

	const activeStep = $derived.by(() => {
		if (!tracking) return -1;
		const status = tracking.order.status === 'paid' ? 'created' : tracking.order.status;
		return steps.findIndex((step) => step.id === status);
	});

	function wsUrl() {
		const base = PUBLIC_API_URL || API_URL;
		return `${base.replace(/^http/, 'ws').replace(/\/$/, '')}/ws`;
	}

	async function load() {
		const res = await getOrderTracking(orderId);

		if (res.error) {
			error = res.error;
			loading = false;
			return;
		}

		error = '';
		tracking = res.data;
		loading = false;
	}

	async function loadMessages() {
		const res = await getOrderMessages(orderId);
		if (res.data) {
			messages = res.data;
			chatError = '';
		}
	}

	function applyLocation(lat: number, lng: number) {
		if (!tracking) return;
		tracking = {
			...tracking,
			location: { lat, lng, updatedAt: new Date().toISOString() }
		};
	}

	function connectSocket() {
		const token = localStorage.getItem('accessToken');
		if (!token) return;

		socket = new WebSocket(wsUrl());

		socket.onopen = () => {
			socket?.send(JSON.stringify({ type: 'auth', token }));
			socket?.send(JSON.stringify({ type: 'subscribe', channel: `order:${orderId}` }));
		};

		socket.onmessage = (event) => {
			const message = JSON.parse(event.data);

			if (message.type === 'order_updated' && message.data?.id === orderId) {
				load();
			}

			if (message.type === 'courier_location' && message.data?.orderId === orderId) {
				applyLocation(message.data.lat, message.data.lng);
			}

			if (message.type === 'chat_message') {
				loadMessages();
			}
		};

		socket.onclose = () => {
			if (destroyed) return;
			socketTimer = setTimeout(connectSocket, 3000);
		};
	}

	async function send() {
		const value = text.trim();
		if (!value || sending) return;

		sending = true;
		chatError = '';

		const res = await sendOrderMessage(orderId, value);

		if (res.error) {
			chatError = res.error;
		} else {
			text = '';
			await loadMessages();
		}

		sending = false;
	}

	function senderLabel(message: Message) {
		if (message.sender === 'courier') return 'Courier';
		if (message.sender === 'admin') return 'Support';
		return 'You';
	}

	onMount(() => {
		load();
		loadMessages();
		connectSocket();

		pollTimer = setInterval(() => {
			load();
			loadMessages();
		}, 5000);

		return () => {
			destroyed = true;
			if (pollTimer) clearInterval(pollTimer);
			if (socketTimer) clearTimeout(socketTimer);
			socket?.close();
			map?.remove();
		};
	});

	$effect(() => {
		if (!mapElement) return;
		if (map) return;

		import('leaflet').then((L) => {
			import('leaflet/dist/leaflet.css');
			leaflet = L;
			const center = tracking?.client?.lat && tracking?.client?.lng
				? [tracking.client.lat, tracking.client.lng]
				: [48.4647, 35.0462];

			map = L.map(mapElement).setView(center as [number, number], 14);
			L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '© OpenStreetMap contributors'
			}).addTo(map);
		});
	});

	$effect(() => {
		const data = tracking;
		const L = leaflet;
		if (!map || !L || !data) return;

		const points: Array<[number, number]> = [];

		if (data.client.lat && data.client.lng) {
			points.push([data.client.lat, data.client.lng]);
			if (!clientMarker) {
				clientMarker = L.marker([data.client.lat, data.client.lng], {
					icon: L.divIcon({
						className: '',
						html: '<span style="display:block;width:18px;height:18px;border-radius:999px;background:#111827;border:3px solid #fff;box-shadow:0 0 0 6px rgba(17,24,39,.18)"></span>',
						iconSize: [18, 18],
						iconAnchor: [9, 9]
					})
				}).addTo(map).bindPopup('Delivery address');
			}
		}

		if (data.location) {
			points.push([data.location.lat, data.location.lng]);
			if (!courierMarker) {
				courierMarker = L.marker([data.location.lat, data.location.lng], {
					icon: L.divIcon({
						className: '',
						html: '<span style="display:block;width:20px;height:20px;border-radius:999px;background:#4f46e5;border:3px solid #fff;box-shadow:0 0 0 8px rgba(79,70,229,.22)"></span>',
						iconSize: [20, 20],
						iconAnchor: [10, 10]
					})
				}).addTo(map).bindPopup('Courier');
			} else {
				courierMarker.setLatLng([data.location.lat, data.location.lng]);
			}
		}

		if (points.length === 2) {
			if (!routeLine) {
				routeLine = L.polyline(points, { color: '#4f46e5', weight: 4, opacity: 0.7 }).addTo(map);
			} else {
				routeLine.setLatLngs(points);
			}
		}

		if (points.length > 0) {
			map.fitBounds(points as [number, number][], { padding: [40, 40], maxZoom: 16 });
		}
	});

	$effect(() => {
		if (tracking?.order.status === 'delivered' && pollTimer) {
			clearInterval(pollTimer);
			pollTimer = null;
		}
	});
</script>

<svelte:head>
	<title>Order tracking - Food Delivery</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
		<div class="flex items-center justify-between gap-4">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Order tracking</h1>
				<p class="text-sm text-gray-600 mt-1">#{orderId.slice(0, 8)}</p>
			</div>
			<a href="/orders" class="text-sm font-semibold text-indigo-600 hover:text-indigo-800">
				All orders
			</a>
		</div>

		{#if loading}
			<div class="bg-white rounded-lg shadow p-12 text-center">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
			</div>
		{:else if error}
			<div class="bg-white rounded-lg shadow p-12 text-center space-y-4">
				<p class="text-gray-700">{error}</p>
				<a href="/login" class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
					Sign in
				</a>
			</div>
		{:else if tracking}
			<div class="bg-white rounded-lg shadow p-6">
				<div class="flex flex-wrap items-center justify-between gap-3 mb-5">
					<span class="text-lg font-semibold text-gray-900 capitalize">
						{tracking.order.status.replace(/_/g, ' ')}
					</span>
					<span class="text-sm text-gray-600">
						{tracking.order.deliveryType === 'delivery' ? 'Delivery' : 'Pickup'}
						· ${parseFloat(tracking.order.totalPrice).toFixed(2)}
					</span>
				</div>

				<ol class="grid grid-cols-5 gap-2">
					{#each steps as step, index (step.id)}
						<li class="flex flex-col items-center gap-2 text-center">
							<span
								class="w-8 h-8 rounded-full grid place-items-center text-sm font-semibold {index <= activeStep
									? 'bg-indigo-600 text-white'
									: 'bg-gray-100 text-gray-500'}"
							>
								{index + 1}
							</span>
							<span class="text-[11px] leading-tight {index <= activeStep ? 'text-gray-900 font-medium' : 'text-gray-500'}">
								{step.label}
							</span>
						</li>
					{/each}
				</ol>
			</div>

			<div class="bg-white rounded-lg shadow overflow-hidden">
				<div bind:this={mapElement} class="h-80 w-full"></div>
				<div class="px-5 py-3 text-xs text-gray-600 border-t">
					{#if tracking.location}
						Courier position updated {new Date(tracking.location.updatedAt).toLocaleTimeString()}
					{:else if tracking.courier}
						Waiting for the courier to share a position
					{:else}
						A courier will be assigned once the order is ready
					{/if}
				</div>
			</div>

			{#if tracking.courier}
				<div class="bg-white rounded-lg shadow p-5 flex items-center justify-between gap-4">
					<div>
						<p class="text-xs uppercase tracking-wide text-gray-500">Your courier</p>
						<p class="font-semibold text-gray-900">{tracking.courier.name}</p>
						{#if tracking.courier.phone}
							<p class="text-sm text-gray-600">{tracking.courier.phone}</p>
						{/if}
					</div>
					{#if tracking.courier.phone}
						<a
							href={`tel:${tracking.courier.phone}`}
							class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
						>
							Call
						</a>
					{/if}
				</div>
			{/if}

			<div class="bg-white rounded-lg shadow">
				<div class="px-5 py-4 border-b">
					<h2 class="text-lg font-semibold text-gray-900">Chat with courier and support</h2>
					<p class="text-xs text-gray-500 mt-1">Messages are delivered live to everyone on this order.</p>
				</div>

				<div class="px-5 py-4 space-y-3 max-h-72 overflow-y-auto">
					{#if messages.length === 0}
						<p class="text-sm text-gray-500">No messages yet.</p>
					{:else}
						{#each messages as message (message.id)}
							<div class="flex {message.sender === 'user' ? 'justify-end' : 'justify-start'}">
								<div
									class="max-w-[80%] rounded-2xl px-4 py-2 text-sm {message.sender === 'user'
										? 'bg-indigo-600 text-white'
										: 'bg-gray-100 text-gray-900'}"
								>
									<p class="text-[11px] opacity-70 mb-0.5">{senderLabel(message)}</p>
									<p>{message.text}</p>
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<form
					class="border-t px-5 py-4 flex items-center gap-2"
					onsubmit={(event) => {
						event.preventDefault();
						send();
					}}
				>
					<input
						class="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
						placeholder="Write a message"
						bind:value={text}
					/>
					<button
						type="submit"
						disabled={sending || !text.trim()}
						class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
					>
						{sending ? 'Sending...' : 'Send'}
					</button>
				</form>
				{#if chatError}
					<p class="px-5 pb-4 text-sm text-red-600">{chatError}</p>
				{/if}
			</div>

			<div class="bg-white rounded-lg shadow p-5 space-y-2">
				<h2 class="text-lg font-semibold text-gray-900">Order details</h2>
				{#each tracking.order.items as item (item.id)}
					<div class="flex justify-between text-sm">
						<span class="text-gray-700">{item.quantity}× {item.product?.name || 'Product'}</span>
						<span class="text-gray-600">${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
					</div>
				{/each}
				{#if tracking.order.address}
					<p class="text-sm text-gray-600 pt-2 border-t">Address: <span class="font-medium">{tracking.order.address}</span></p>
				{/if}
				<p class="text-sm text-gray-600">
					Payment: <span class="font-medium capitalize">{tracking.order.paymentType}</span> ·
					<span class="capitalize">{tracking.order.paymentStatus}</span>
				</p>
			</div>
		{/if}
	</div>
</div>
