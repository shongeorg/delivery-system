<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getCart, createOrder } from '$lib/api';
	import type { CartItem } from '$lib/types';

	let items: CartItem[] = [];
	let address = '';
	let phone = '';
	let deliveryType: 'pickup' | 'delivery' = 'delivery';
	let paymentType: 'card' | 'cash' = 'card';
	let loading = false;
	let error = '';

	onMount(async () => {
		const res = await getCart();
		if (res.data && res.data.items.length > 0) {
			items = res.data.items;
		} else {
			goto('/cart');
		}
	});

	function calculateTotal(): string {
		return items.reduce((total, item) => {
			return total + (parseFloat(item.product.price) * item.item.quantity);
		}, 0).toFixed(2);
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		const orderData = {
			deliveryType,
			address: deliveryType === 'delivery' ? address : undefined,
			phone,
			paymentType,
			items: items.map(item => ({
				productId: item.product.id,
				quantity: item.item.quantity,
			})),
		};

		const res = await createOrder(orderData);

		if (res.error) {
			error = res.error;
			loading = false;
		} else {
			// Success - redirect to orders
			goto('/orders');
		}
	}
</script>

<svelte:head>
	<title>Checkout - Food Delivery</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

		<form on:submit={handleSubmit}>
			<div class="grid md:grid-cols-2 gap-8">
				<!-- Order Details -->
				<div class="space-y-6">
					<div class="bg-white rounded-lg shadow p-6">
						<h2 class="text-xl font-semibold text-gray-900 mb-4">Delivery Information</h2>

						<!-- Delivery Type -->
						<div class="mb-4">
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Delivery Type
							</label>
							<div class="flex space-x-4">
								<label class="flex items-center">
									<input
										type="radio"
										name="deliveryType"
										value="delivery"
										bind:group={deliveryType}
										class="text-indigo-600 focus:ring-indigo-500"
									/>
									<span class="ml-2">Delivery</span>
								</label>
								<label class="flex items-center">
									<input
										type="radio"
										name="deliveryType"
										value="pickup"
										bind:group={deliveryType}
										class="text-indigo-600 focus:ring-indigo-500"
									/>
									<span class="ml-2">Pickup</span>
								</label>
							</div>
						</div>

						{#if deliveryType === 'delivery'}
							<div class="mb-4">
								<label for="address" class="block text-sm font-medium text-gray-700 mb-2">
									Delivery Address
								</label>
								<textarea
									id="address"
									name="address"
									rows="3"
									required={deliveryType === 'delivery'}
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
									placeholder="Enter your delivery address"
									bind:value={address}
								></textarea>
							</div>
						{/if}

						<div class="mb-4">
							<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
								Phone Number
							</label>
							<input
								id="phone"
								name="phone"
								type="tel"
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="+1 (555) 123-4567"
								bind:value={phone}
							/>
						</div>

						<!-- Payment Type -->
						<div>
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Payment Method
							</label>
							<div class="flex space-x-4">
								<label class="flex items-center">
									<input
										type="radio"
										name="paymentType"
										value="card"
										bind:group={paymentType}
										class="text-indigo-600 focus:ring-indigo-500"
									/>
									<span class="ml-2">Card</span>
								</label>
								<label class="flex items-center">
									<input
										type="radio"
										name="paymentType"
										value="cash"
										bind:group={paymentType}
										class="text-indigo-600 focus:ring-indigo-500"
									/>
									<span class="ml-2">Cash</span>
								</label>
							</div>
						</div>
					</div>

					{#if error}
						<div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
							{error}
						</div>
					{/if}

					<button
						type="submit"
						disabled={loading}
						class="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
					>
						{#if loading}
							Processing...
						{:else}
							Place Order - ${calculateTotal()}
						{/if}
					</button>
				</div>

				<!-- Order Summary -->
				<div class="bg-white rounded-lg shadow p-6 h-fit">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

					<ul class="divide-y divide-gray-200 mb-6">
						{#each items as item}
							<li class="py-3 flex justify-between">
								<div>
									<p class="font-medium text-gray-900">{item.product.name}</p>
									<p class="text-sm text-gray-600">Qty: {item.item.quantity}</p>
								</div>
								<p class="font-medium text-gray-900">
									${(parseFloat(item.product.price) * item.item.quantity).toFixed(2)}
								</p>
							</li>
						{/each}
					</ul>

					<div class="border-t border-gray-200 pt-4">
						<div class="flex items-center justify-between text-lg font-bold">
							<span>Total:</span>
							<span class="text-indigo-600">${calculateTotal()}</span>
						</div>
					</div>
				</div>
			</div>
		</form>
	</div>
</div>
