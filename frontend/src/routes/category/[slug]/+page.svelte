<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getCategory, addToCart } from '$lib/api';
	import type { Product, Category } from '$lib/types';
	import { cartStore } from '$lib/stores/cartStore';
	import Pagination from '$lib/components/Pagination.svelte';

	let category: Category | null = $state(null);
	let products: Product[] = $state([]);
	let slug = $state('');
	let loading = $state(true);
	
	let currentPage = $state(1);
	let lastPage = $state(1);
	let totalProducts = $state(0);

	function getPageFromURL(): number {
		const params = new URLSearchParams($page.url.search);
		return parseInt(params.get('page') || '1');
	}

	function getSlugFromURL(): string {
		const parts = $page.url.pathname.split('/').filter(Boolean);
		return parts[parts.length - 1] || '';
	}

	async function loadCategoryData(pageNum: number, categorySlug: string) {
		loading = true;
		currentPage = pageNum;
		slug = categorySlug;
		const res = await getCategory(categorySlug, pageNum, 12);
		if (res.data) {
			category = res.data.category;
			products = res.data.products;
			lastPage = res.data.pagination.lastPage;
			totalProducts = res.data.pagination.total;
		}
		loading = false;
	}

	$effect(() => {
		const p = getPageFromURL();
		const s = getSlugFromURL();
		if ((p !== currentPage || s !== slug) && !loading) {
			loadCategoryData(p, s);
		}
	});

	onMount(async () => {
		const initialPage = getPageFromURL();
		const initialSlug = getSlugFromURL();
		await loadCategoryData(initialPage, initialSlug);
	});

	function handlePageChange(newPage: number) {
		goto(`/category/${slug}?page=${newPage}`);
	}

	async function handleAddToCart(product: Product) {
		await addToCart(product.id, 1);
	}
</script>

<svelte:head>
	<title>{category?.name || 'Category'} - Food Delivery</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
		{#if loading}
			<div class="text-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
			</div>
		{:else if !category}
			<div class="text-center py-12">
				<p class="text-gray-600">Category not found</p>
				<a href="/catalog" class="mt-4 text-indigo-600 hover:text-indigo-500">← Back to catalog</a>
			</div>
		{:else}
			<div class="mb-6">
				<a href="/" class="text-indigo-600 hover:text-indigo-500">← Back to home</a>
			</div>

			<div class="mb-8">
				{#if category.cover}
					<img src={category.cover} alt={category.name} class="w-full h-48 object-cover rounded-lg mb-4" />
				{/if}
				<h1 class="text-3xl font-bold text-gray-900">{category.name}</h1>
				{#if category.description}
					<p class="text-gray-600 mt-2">{category.description}</p>
				{/if}
				<p class="text-sm text-gray-500 mt-2">{totalProducts} products</p>
			</div>

			{#if products.length === 0}
				<div class="text-center py-12 bg-white rounded-lg shadow">
					<p class="text-gray-600">No products in this category</p>
				</div>
			{:else}
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
		{/if}
	</div>
</div>
