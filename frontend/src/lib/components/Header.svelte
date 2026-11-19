<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/userStore';
	import { cartCount, refreshCartCount } from '$lib/stores/cartCount';
	import type { User } from '$lib/types';

	let user = $state<User | null>(null);
	let count = $state(0);
	let mobileOpen = $state(false);

	userStore.subscribe((value) => {
		user = value;
	});

	cartCount.subscribe((value) => {
		count = value;
	});

	onMount(() => {
		if (user) refreshCartCount();
	});

	function handleLogout() {
		localStorage.removeItem('accessToken');
		localStorage.removeItem('refreshToken');
		userStore.logout();
		cartCount.reset();
		mobileOpen = false;
		goto('/login');
	}
</script>

<header class="bg-white shadow">
	<nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
		<div class="flex items-center justify-between">
			<a href="/" class="text-2xl font-bold text-indigo-600">🍕 FoodDelivery</a>

			<div class="hidden md:flex items-center space-x-6">
				<a href="/catalog" class="text-gray-700 hover:text-indigo-600 transition">Catalog</a>
				{#if user}
					<a href="/orders" class="text-gray-700 hover:text-indigo-600 transition">Orders</a>
					<a href="/profile/{user.slug}" class="text-gray-700 hover:text-indigo-600 transition">
						Profile
					</a>
				{/if}
			</div>

			<div class="flex items-center space-x-4">
				{#if user}
					<a href="/cart" class="relative text-gray-700 hover:text-indigo-600 transition">
						🛒 Cart
						{#if count > 0}
							<span
								class="absolute -top-2 -right-3 min-w-5 h-5 px-1 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center"
							>
								{count}
							</span>
						{/if}
					</a>
					<span class="hidden sm:inline text-gray-600">Hi, {user.name}!</span>
					<button
						type="button"
						onclick={handleLogout}
						class="text-red-600 hover:text-red-500 transition"
					>
						Logout
					</button>
					<button
						type="button"
						onclick={() => (mobileOpen = !mobileOpen)}
						class="md:hidden text-gray-700 text-xl leading-none px-2"
						aria-label="Toggle navigation"
						aria-expanded={mobileOpen}
					>
						{mobileOpen ? '✕' : '☰'}
					</button>
				{:else}
					<a href="/login" class="text-gray-700 hover:text-indigo-600 transition">Login</a>
					<a
						href="/register"
						class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
					>
						Register
					</a>
				{/if}
			</div>
		</div>

		{#if user && mobileOpen}
			<div class="md:hidden mt-4 pt-4 border-t border-gray-200 flex flex-col space-y-3">
				<a href="/catalog" class="text-gray-700 hover:text-indigo-600" onclick={() => (mobileOpen = false)}>
					Catalog
				</a>
				<a href="/orders" class="text-gray-700 hover:text-indigo-600" onclick={() => (mobileOpen = false)}>
					Orders
				</a>
				<a
					href="/profile/{user.slug}"
					class="text-gray-700 hover:text-indigo-600"
					onclick={() => (mobileOpen = false)}
				>
					Profile
				</a>
			</div>
		{/if}
	</nav>
</header>
