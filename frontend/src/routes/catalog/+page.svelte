<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getProducts, getCategories, addToCart } from '$lib/api';
	import type { Product, Category } from '$lib/types';
	import { cartStore } from '$lib/stores/cartStore';
	import Pagination from '$lib/components/Pagination.svelte';

	let products: Product[] = $state([]);
	let categories: Category[] = $state([]);
	let loading = $state(true);
	
	let currentPage = $state(1);
	let lastPage = $state(1);
	let totalProducts = $state(0);

	onMount(async () => {
		const p = page.data.page ? parseInt(page.data.page as string) : 1;
		currentPage = p;
		
		const categoriesRes = await getCategories();
		if (categoriesRes.data) categories = categoriesRes.data;
		loading = false;
		
		await loadProducts();
	});

	async function loadProducts() {
		loading = true;
		const productsRes = await getProducts(currentPage, 12);
		if (productsRes.data) {
			products = productsRes.data.products;
			lastPage = productsRes.data.pagination.lastPage;
			totalProducts = productsRes.data.pagination.total;
		}
		loading = false;
	}

	function handlePageChange(pageNum: number) {
		goto(`/catalog?page=${pageNum}`);
	}

	async function handleAddToCart(product: Product) {
		await addToCart(product.id, 1);
	}
</script>

<svelte:head>
	<title>Catalog - Food Delivery</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-8">Catalog</h1>

		<!-- Categories -->
		<div class="mb-8">
			<h2 class="text-xl font-semibold text-gray-700 mb-4">Categories</h2>
			{#if categories.length === 0}
				<p class="text-gray-500">Loading categories...</p>
			{:else}
				<div class="flex flex-wrap gap-3">
					<a
						href="/catalog"
						class="px-4 py-2 rounded-full border-2 border-gray-300 hover:border-indigo-600 transition"
					>
						All
					</a>
					{#each categories as category}
						<a
							href="/category/{category.slug}"
							class="px-4 py-2 rounded-full border-2 border-gray-300 hover:border-indigo-600 transition"
						>
							{category.name}
						</a>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Products Grid -->
		{#if loading}
			<div class="text-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
				<p class="mt-4 text-gray-600">Loading products...</p>
			</div>
		{:else if products.length === 0}
			<div class="text-center py-12 bg-white rounded-lg shadow">
				<p class="text-gray-600 text-lg">No products found</p>
			</div>
		{:else}
			<div class="flex items-center justify-between mb-4">
				<p class="text-gray-600">Showing {products.length} of {totalProducts} products (Page {currentPage}/{lastPage})</p>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{#each products as product (product.id)}
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
			
			<Pagination
				currentPage={currentPage}
				lastPage={lastPage}
				onPageChange={handlePageChange}
			/>
		{/if}
	</div>
</div>
