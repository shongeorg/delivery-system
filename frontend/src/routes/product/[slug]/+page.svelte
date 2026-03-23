<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, useParams } from '$app/navigation';
	import { getProduct, addToCart } from '$lib/api';
	import { userStore } from '$lib/stores/userStore';
	import type { Product } from '$lib/types';

	let params = useParams();
	let product: Product | null = null;
	let quantity = 1;
	let loading = true;
	let error = '';
	let addingToCart = false;

	onMount(async () => {
		if (!params.slug) {
			goto('/catalog');
			return;
		}

		const res = await getProduct(params.slug);
		if (res.error) {
			error = res.error;
		} else {
			product = res.data;
		}
		loading = false;
	});

	async function handleAddToCart() {
		if (!product) return;
		
		addingToCart = true;
		const res = await addToCart(product.id, quantity);
		
		if (res.error) {
			error = res.error;
		} else {
			// Success - could show toast
		}
		addingToCart = false;
	}
</script>

<svelte:head>
	<title>{product?.name || 'Product'} - Food Delivery</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
		{#if loading}
			<div class="text-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
			</div>
		{:else if error || !product}
			<div class="text-center py-12">
				<p class="text-red-600 text-lg">{error || 'Product not found'}</p>
				<a href="/catalog" class="mt-4 inline-block text-indigo-600 hover:text-indigo-500">
					← Back to catalog
				</a>
			</div>
		{:else}
			<!-- Breadcrumb -->
			<div class="mb-6">
				<a href="/catalog" class="text-indigo-600 hover:text-indigo-500">
					← Back to catalog
				</a>
			</div>

			<!-- Product Details -->
			<div class="bg-white rounded-lg shadow-lg overflow-hidden">
				<div class="grid md:grid-cols-2 gap-8 p-8">
					<!-- Image -->
					<div>
						{#if product.cover}
							<img src={product.cover} alt={product.name} class="w-full h-96 object-cover rounded-lg" />
						{:else}
							<div class="w-full h-96 bg-gray-200 flex items-center justify-center rounded-lg">
								<span class="text-8xl">🍕</span>
							</div>
						{/if}
					</div>

					<!-- Info -->
					<div class="space-y-4">
						<h1 class="text-3xl font-bold text-gray-900">{product.name}</h1>
						
						<p class="text-gray-600">{product.description}</p>

						<!-- Price -->
						<div class="text-3xl font-bold text-indigo-600">
							${parseFloat(product.price).toFixed(2)}
						</div>

						<!-- Categories -->
						{#if product.categories && product.categories.length > 0}
							<div>
								<span class="font-semibold text-gray-700">Categories:</span>
								<div class="flex flex-wrap gap-2 mt-2">
									{#each product.categories as category}
										<span class="bg-indigo-100 text-indigo-800 px-3 py-1 rounded-full text-sm">
											{category.name}
										</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Tags -->
						{#if product.tags && product.tags.length > 0}
							<div>
								<span class="font-semibold text-gray-700">Tags:</span>
								<div class="flex flex-wrap gap-2 mt-2">
									{#each product.tags as tag}
										<span class="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
											{tag.name}
										</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Ingredients -->
						{#if product.ingredients && product.ingredients.length > 0}
							<div>
								<span class="font-semibold text-gray-700">Ingredients:</span>
								<ul class="list-disc list-inside mt-2 text-gray-600">
									{#each product.ingredients as ingredient}
										<li>{ingredient.name} - {ingredient.quantity} {ingredient.unit}</li>
									{/each}
								</ul>
							</div>
						{/if}

						<!-- Quantity & Add to Cart -->
						<div class="pt-6 border-t border-gray-200">
							<label class="block text-sm font-medium text-gray-700 mb-2">
								Quantity
							</label>
							<div class="flex items-center space-x-4">
								<input
									type="number"
									min="1"
									max="99"
									value={quantity}
									class="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
									on:change={(e) => quantity = parseInt(e.target.value) || 1}
								/>
								<button
									on:click={handleAddToCart}
									disabled={addingToCart}
									class="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
								>
									{#if addingToCart}
										Adding...
									{:else}
										Add to Cart
									{/if}
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
