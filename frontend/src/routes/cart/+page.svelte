<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getCart, updateCartItem, removeFromCart, clearCart } from '$lib/api';
	import { cartStore } from '$lib/stores/cartStore';
	import type { CartItem } from '$lib/types';

	let items: CartItem[] = [];
	let loading = true;
	let updating = false;

	onMount(async () => {
		await loadCart();
	});

	async function loadCart() {
		const res = await getCart();
		if (res.data) {
			items = res.data.items || [];
			cartStore.set(res.data);
		}
		loading = false;
	}

	async function handleUpdateQuantity(itemId: string, quantity: number) {
		if (quantity < 1) return;
		
		updating = true;
		const res = await updateCartItem(itemId, quantity);
		
		if (res.data) {
			await loadCart();
		}
		updating = false;
	}

	async function handleRemove(itemId: string) {
		const res = await removeFromCart(itemId);
		if (res.data) {
			await loadCart();
		}
	}

	async function handleClear() {
		if (!confirm('Are you sure you want to clear your cart?')) return;
		const res = await clearCart();
		if (res.data) {
			items = [];
			cartStore.clear();
		}
	}

	function calculateTotal(): string {
		return items.reduce((total, item) => {
			return total + (parseFloat(item.product.price) * item.item.quantity);
		}, 0).toFixed(2);
	}
</script>

<svelte:head>
	<title>Shopping Cart - Food Delivery</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

		{#if loading}
			<div class="text-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
			</div>
		{:else if items.length === 0}
			<div class="text-center py-12 bg-white rounded-lg shadow">
				<span class="text-6xl mb-4 block">🛒</span>
				<p class="text-gray-600 text-lg mb-6">Your cart is empty</p>
				<a href="/catalog" class="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
					Start Shopping
				</a>
			</div>
		{:else}
			<!-- Cart Items -->
			<div class="bg-white rounded-lg shadow mb-6">
				<ul class="divide-y divide-gray-200">
					{#each items as item}
						<li class="p-6 flex items-center space-x-4">
							<!-- Product Image -->
							{#if item.product.cover}
								<img src={item.product.cover} alt={item.product.name} class="w-20 h-20 object-cover rounded" />
							{:else}
								<div class="w-20 h-20 bg-gray-200 flex items-center justify-center rounded">
									<span class="text-2xl">🍕</span>
								</div>
							{/if}

							<!-- Product Info -->
							<div class="flex-1">
								<h3 class="font-semibold text-gray-900">{item.product.name}</h3>
								<p class="text-indigo-600 font-bold">${parseFloat(item.product.price).toFixed(2)}</p>
							</div>

							<!-- Quantity Controls -->
							<div class="flex items-center space-x-2">
								<button
									on:click={() => handleUpdateQuantity(item.item.id, item.item.quantity - 1)}
									disabled={updating || item.item.quantity <= 1}
									class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center"
								>
									−
								</button>
								<span class="w-12 text-center font-medium">{item.item.quantity}</span>
								<button
									on:click={() => handleUpdateQuantity(item.item.id, item.item.quantity + 1)}
									disabled={updating}
									class="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 flex items-center justify-center"
								>
									+
								</button>
							</div>

							<!-- Subtotal -->
							<div class="text-right min-w-[100px]">
								<p class="font-bold text-gray-900">
									${(parseFloat(item.product.price) * item.item.quantity).toFixed(2)}
								</p>
							</div>

							<!-- Remove Button -->
							<button
								on:click={() => handleRemove(item.item.id)}
								disabled={updating}
								class="text-red-600 hover:text-red-500 disabled:opacity-50"
							>
								✕
							</button>
						</li>
					{/each}
				</ul>
			</div>

			<!-- Cart Summary -->
			<div class="bg-white rounded-lg shadow p-6">
				<div class="flex items-center justify-between mb-4">
					<span class="text-lg font-semibold text-gray-700">Total:</span>
					<span class="text-2xl font-bold text-indigo-600">${calculateTotal()}</span>
				</div>

				<div class="flex items-center justify-between space-x-4">
					<button
						on:click={handleClear}
						disabled={updating}
						class="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
					>
						Clear Cart
					</button>
					<a
						href="/checkout"
						class="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-indigo-700 transition"
					>
						Proceed to Checkout
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>
