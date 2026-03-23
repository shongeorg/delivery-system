<script lang="ts">
	import { onMount } from 'svelte';
	import { getProducts, getCategories, addToCart } from '$lib/api';
	import type { Product, Category } from '$lib/types';
	import { cartStore } from '$lib/stores/cartStore';

	let products: Product[] = $state([]);
	let categories: Category[] = $state([]);
	let loading = $state(true);
	let selectedCategory = $state('');

	onMount(async () => {
		const [productsRes, categoriesRes] = await Promise.all([
			getProducts(),
			getCategories()
		]);

		if (productsRes.data) products = productsRes.data;
		if (categoriesRes.data) categories = categoriesRes.data;
		
		loading = false;
	});

	function filterByCategory(categorySlug: string) {
		selectedCategory = categorySlug;
	}

	function clearFilter() {
		selectedCategory = '';
	}

	function getFilteredProducts() {
		if (!selectedCategory) return products;
		return products.filter(p => 
			p.categories?.some(c => c.slug === selectedCategory)
		);
	}

	async function handleAddToCart(product: Product) {
		await addToCart(product.id, 1);
	}
</script>

<svelte:head>
	<title>Food Delivery - Home</title>
</svelte:head>

<div class="min-h-screen bg-gray-50">
	<!-- Hero Section -->
	<div class="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-16">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
			<h1 class="text-4xl font-bold mb-4">🍕 Delicious Food Delivered To You</h1>
			<p class="text-xl mb-8">Order your favorite meals and get them delivered fast!</p>
			<a href="#catalog" class="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
				Order Now
			</a>
		</div>
	</div>

	<!-- Categories -->
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<h2 class="text-3xl font-bold text-gray-900 mb-8">Categories</h2>
		{#if categories.length === 0}
			<p class="text-gray-500">Loading categories...</p>
		{:else}
			<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
				{#each categories as category (category.id)}
					<button
						onclick={() => filterByCategory(category.slug)}
						class="p-6 bg-white rounded-lg shadow hover:shadow-lg transition text-center border-2 {selectedCategory === category.slug ? 'border-indigo-600' : 'border-transparent'}"
					>
						{#if category.cover}
							<img src={category.cover} alt={category.name} class="w-16 h-16 mx-auto mb-2 object-cover rounded-full" />
						{:else}
							<div class="text-4xl mb-2">🍽️</div>
						{/if}
						<span class="font-semibold text-gray-800">{category.name}</span>
					</button>
				{/each}
			</div>
		{/if}
		{#if selectedCategory}
			<div class="mt-4 text-center">
				<button onclick={clearFilter} class="text-indigo-600 hover:text-indigo-500 font-medium">
					Clear filter ✕
				</button>
			</div>
		{/if}
	</div>

	<!-- Products Catalog -->
	<div id="catalog" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
		<h2 class="text-3xl font-bold text-gray-900 mb-8">Our Menu</h2>
		
		{#if loading}
			<div class="text-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
				<p class="mt-4 text-gray-600">Loading delicious food...</p>
			</div>
		{:else if getFilteredProducts().length === 0}
			<div class="text-center py-12">
				<p class="text-gray-600">No products found in this category</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{#each getFilteredProducts() as product (product.id)}
					<div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
						{#if product.cover}
							<img src={product.cover} alt={product.name} class="w-full h-48 object-cover" />
						{:else}
							<div class="w-full h-48 bg-gray-200 flex items-center justify-center">
								<span class="text-6xl">🍕</span>
							</div>
						{/if}
						<div class="p-4">
							<h3 class="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
							<p class="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
							<div class="flex items-center justify-between mb-3">
								<span class="text-xl font-bold text-indigo-600">${parseFloat(product.price).toFixed(2)}</span>
							</div>
							<div class="flex gap-2">
								<button 
									onclick={() => handleAddToCart(product)}
									class="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition text-sm font-medium"
								>
									Add to Cart
								</button>
								<a href="/product/{product.slug}" class="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition text-sm text-center">
									View
								</a>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>
