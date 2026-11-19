<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from '$env/static/public';
	import { loadStripe, type Stripe, type StripeCardElement } from '@stripe/stripe-js';
	import {
		getCart,
		createOrder,
		createPaymentIntent,
		confirmPayment,
		getCurrentUser
	} from '$lib/api';

	interface CartLineItem {
		id: string;
		cartId: string;
		productId: string;
		quantity: number;
		product: {
			id: string;
			name: string;
			slug: string;
			price: string;
			cover?: string | null;
		};
	}

	interface CurrentUser {
		id: string;
		name: string;
		email: string;
		phone?: string | null;
		address?: string | null;
	}

	let items: CartLineItem[] = $state([]);
	let cartLoading = $state(true);
	let address = $state('');
	let phone = $state('');
	let deliveryType: 'pickup' | 'delivery' = $state('delivery');
	let paymentType: 'card' | 'cash' = $state('card');
	let user = $state<CurrentUser | null>(null);
	let loading = $state(false);
	let error = $state('');
	let step = $state('');
	let cardReady = $state(false);

	let stripe: Stripe | null = null;
	let cardElement: StripeCardElement | null = null;
	let cardMount: HTMLDivElement | undefined = $state();

	const hasStripeKey = Boolean(PUBLIC_STRIPE_PUBLISHABLE_KEY);

	onMount(async () => {
		const [cartRes, userRes] = await Promise.all([getCart(), getCurrentUser()]);

		if (cartRes.data && cartRes.data.items && cartRes.data.items.length > 0) {
			items = cartRes.data.items;
		} else {
			goto('/cart');
			return;
		}

		if (userRes.data) {
			user = userRes.data;
			phone = user.phone ?? '';
			address = user.address ?? '';
		}

		cartLoading = false;

		if (hasStripeKey) {
			stripe = await loadStripe(PUBLIC_STRIPE_PUBLISHABLE_KEY);
			await mountCard();
		}
	});

	async function mountCard() {
		if (!stripe || !cardMount || cardElement) return;

		cardElement = stripe.elements().create('card', {
			style: {
				base: {
					fontSize: '16px',
					color: '#1f2937',
					'::placeholder': { color: '#9ca3af' }
				},
				invalid: { color: '#dc2626' }
			}
		});

		cardElement.on('ready', () => {
			cardReady = true;
		});

		cardElement.mount(cardMount);
	}

	async function selectPaymentType(type: 'card' | 'cash') {
		paymentType = type;
		if (type === 'card') {
			await tick();
			await mountCard();
		}
	}

	function calculateTotal(): string {
		return items
			.reduce((total, item) => total + parseFloat(item.product.price) * item.quantity, 0)
			.toFixed(2);
	}

	function validate(): string {
		if (deliveryType === 'delivery' && address.trim().length < 5) {
			return 'Enter a valid delivery address';
		}
		if (phone.trim().length < 5) {
			return 'Enter a valid phone number';
		}
		if (paymentType === 'card' && !hasStripeKey) {
			return 'Card payments are not configured';
		}
		return '';
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		const validationError = validate();
		if (validationError) {
			error = validationError;
			return;
		}

		loading = true;
		step = 'Creating order...';

		const orderRes = await createOrder({
			deliveryType,
			address: deliveryType === 'delivery' ? address.trim() : undefined,
			phone: phone.trim(),
			paymentType,
			items: items.map((item) => ({
				productId: item.product.id,
				quantity: item.quantity
			}))
		});

		if (orderRes.error || !orderRes.data) {
			error = orderRes.error ?? 'Failed to create order';
			loading = false;
			step = '';
			return;
		}

		const orderId: string = orderRes.data.id;

		if (paymentType === 'cash') {
			goto(`/orders?success=1&order=${orderId}`);
			return;
		}

		if (!stripe || !cardElement) {
			error = 'Card form is not ready. Reload the page and try again.';
			loading = false;
			step = '';
			return;
		}

		step = 'Preparing payment...';
		const intentRes = await createPaymentIntent(orderId);

		if (intentRes.error || !intentRes.data) {
			error = intentRes.error ?? 'Failed to start payment';
			loading = false;
			step = '';
			return;
		}

		step = 'Processing payment...';
		const result = await stripe.confirmCardPayment(intentRes.data.clientSecret, {
			payment_method: {
				card: cardElement,
				billing_details: {
					name: user?.name ?? '',
					phone: phone.trim()
				}
			}
		});

		if (result.error) {
			error = result.error.message ?? 'Payment failed';
			loading = false;
			step = '';
			return;
		}

		if (result.paymentIntent?.status !== 'succeeded') {
			error = 'Payment was not completed';
			loading = false;
			step = '';
			return;
		}

		step = 'Finishing up...';
		const confirmRes = await confirmPayment(orderId, result.paymentIntent.id);

		if (confirmRes.error) {
			error = `Payment succeeded but the order was not updated: ${confirmRes.error}`;
			loading = false;
			step = '';
			return;
		}

		goto(`/orders?success=1&order=${orderId}`);
	}
</script>

<svelte:head>
	<title>Checkout - Food Delivery</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

		<form onsubmit={handleSubmit} novalidate>
			<div class="grid md:grid-cols-2 gap-8">
				<div class="space-y-6">
					<div class="bg-white rounded-lg shadow p-6">
						<h2 class="text-xl font-semibold text-gray-900 mb-4">Delivery Information</h2>

						<div class="mb-4">
							<span class="block text-sm font-medium text-gray-700 mb-2">Delivery Type</span>
							<div class="flex space-x-4">
								<label class="flex items-center cursor-pointer">
									<input
										type="radio"
										name="deliveryType"
										value="delivery"
										bind:group={deliveryType}
										class="text-indigo-600 focus:ring-indigo-500"
									/>
									<span class="ml-2">Delivery</span>
								</label>
								<label class="flex items-center cursor-pointer">
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
									autocomplete="street-address"
									class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
									placeholder="Street, building, apartment, city"
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
								autocomplete="tel"
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="+1 (555) 123-4567"
								bind:value={phone}
							/>
						</div>

						<div>
							<span class="block text-sm font-medium text-gray-700 mb-2">Payment Method</span>
							<div class="grid grid-cols-2 gap-3">
								<button
									type="button"
									onclick={() => selectPaymentType('card')}
									class="flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition {paymentType === 'card'
										? 'border-indigo-600 bg-indigo-50 text-indigo-700'
										: 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}"
								>
									💳 Card
								</button>
								<button
									type="button"
									onclick={() => selectPaymentType('cash')}
									class="flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition {paymentType === 'cash'
										? 'border-indigo-600 bg-indigo-50 text-indigo-700'
										: 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'}"
								>
									💵 Cash
								</button>
							</div>
						</div>

						<div class="mt-4" class:hidden={paymentType !== 'card'}>
							{#if !hasStripeKey}
								<p class="text-sm text-red-600">
									Card payments are not configured. Choose cash to continue.
								</p>
							{:else}
								<label class="block text-sm font-medium text-gray-700 mb-2">Card Details</label>
								<div
									bind:this={cardMount}
									class="w-full px-3 py-3 border border-gray-300 rounded-md bg-white"
								></div>
								{#if !cardReady}
									<p class="text-xs text-gray-500 mt-2">Loading secure card form...</p>
								{:else}
									<p class="text-xs text-gray-500 mt-2">
										Payments are processed securely by Stripe.
									</p>
								{/if}
							{/if}
						</div>

						<div class="mt-4" class:hidden={paymentType !== 'cash'}>
							<p class="text-sm text-gray-600">Pay the courier or at pickup in cash.</p>
						</div>
					</div>

					{#if error}
						<div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
							{error}
						</div>
					{/if}

					<button
						type="submit"
						disabled={loading || cartLoading || items.length === 0}
						class="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{#if loading}
							{step || 'Processing...'}
						{:else}
							Place Order - ${calculateTotal()}
						{/if}
					</button>
				</div>

				<div class="bg-white rounded-lg shadow p-6 h-fit">
					<h2 class="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>

					{#if cartLoading}
						<p class="text-gray-600">Loading items...</p>
					{:else}
						<ul class="divide-y divide-gray-200 mb-6">
							{#each items as item (item.id)}
								<li class="py-3 flex justify-between gap-4">
									<div>
										<p class="font-medium text-gray-900">{item.product.name}</p>
										<p class="text-sm text-gray-600">Qty: {item.quantity}</p>
									</div>
									<p class="font-medium text-gray-900 whitespace-nowrap">
										${(parseFloat(item.product.price) * item.quantity).toFixed(2)}
									</p>
								</li>
							{/each}
						</ul>
					{/if}

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
