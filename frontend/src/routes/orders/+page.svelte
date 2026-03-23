<script lang="ts">
	import { onMount } from 'svelte';
	import { getMyOrders } from '$lib/api';
	import type { Order } from '$lib/types';

	let orders: Order[] = [];
	let loading = true;

	onMount(async () => {
		const res = await getMyOrders();
		if (res.data) {
			orders = res.data;
		}
		loading = false;
	});

	function getStatusColor(status: string): string {
		switch (status) {
			case 'created': return 'bg-gray-100 text-gray-800';
			case 'paid': return 'bg-blue-100 text-blue-800';
			case 'cooking': return 'bg-yellow-100 text-yellow-800';
			case 'ready': return 'bg-green-100 text-green-800';
			case 'on_the_way': return 'bg-purple-100 text-purple-800';
			case 'delivered': return 'bg-indigo-100 text-indigo-800';
			case 'cancelled': return 'bg-red-100 text-red-800';
			default: return 'bg-gray-100 text-gray-800';
		}
	}

	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<svelte:head>
	<title>My Orders - Food Delivery</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-8">My Orders</h1>

		{#if loading}
			<div class="text-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
			</div>
		{:else if orders.length === 0}
			<div class="text-center py-12 bg-white rounded-lg shadow">
				<span class="text-6xl mb-4 block">📦</span>
				<p class="text-gray-600 text-lg mb-6">You haven't placed any orders yet</p>
				<a href="/catalog" class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
					Start Shopping
				</a>
			</div>
		{:else}
			<div class="space-y-4">
				{#each orders as order}
					<div class="bg-white rounded-lg shadow p-6">
						<div class="flex items-center justify-between mb-4">
							<div>
								<h3 class="text-lg font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</h3>
								<p class="text-sm text-gray-600">{formatDate(order.createdAt)}</p>
							</div>
							<span class="px-3 py-1 rounded-full text-sm font-medium {getStatusColor(order.status)}">
								{order.status.replace('_', ' ').toUpperCase()}
							</span>
						</div>

						<!-- Order Items -->
						{#if order.items}
							<ul class="divide-y divide-gray-200 mb-4">
								{#each order.items as item}
									<li class="py-2 flex justify-between">
										<div>
											<p class="text-gray-900">{item.product?.name || 'Product'}</p>
											<p class="text-sm text-gray-600">Qty: {item.quantity}</p>
										</div>
										<p class="text-gray-900">${(parseFloat(item.price) * item.quantity).toFixed(2)}</p>
									</li>
								{/each}
							</ul>
						{/if}

						<!-- Order Footer -->
						<div class="flex items-center justify-between pt-4 border-t border-gray-200">
							<div>
								<p class="text-sm text-gray-600">Delivery: <span class="font-medium">{order.deliveryType}</span></p>
								<p class="text-sm text-gray-600">Payment: <span class="font-medium">{order.paymentType}</span></p>
							</div>
							<div class="text-right">
								<p class="text-lg font-bold text-indigo-600">${order.totalPrice}</p>
								<p class="text-xs text-gray-500">{order.paymentStatus}</p>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
