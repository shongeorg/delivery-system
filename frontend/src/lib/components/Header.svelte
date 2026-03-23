<script lang="ts">
	import { userStore } from '$lib/stores/userStore';
	import type { User } from '$lib/types';

	let user = $state<User | null>(null);

	userStore.subscribe(value => {
		user = value;
	});
</script>

<header class="bg-white shadow">
	<nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
		<div class="flex items-center justify-between">
			<!-- Logo -->
			<a href="/" class="text-2xl font-bold text-indigo-600">
				🍕 FoodDelivery
			</a>

			<!-- Navigation -->
			<div class="hidden md:flex items-center space-x-6">
				<a href="/catalog" class="text-gray-700 hover:text-indigo-600 transition">
					Catalog
				</a>
				{#if user}
					<a href="/orders" class="text-gray-700 hover:text-indigo-600 transition">
						Orders
					</a>
					<a href="/profile/{user.slug}" class="text-gray-700 hover:text-indigo-600 transition">
						Profile
					</a>
				{/if}
			</div>

			<!-- Right Side -->
			<div class="flex items-center space-x-4">
				{#if user}
					<a href="/cart" class="relative text-gray-700 hover:text-indigo-600 transition">
						🛒 Cart
					</a>
					<span class="text-gray-600">Hi, {user.name}!</span>
					<a href="/login" class="text-red-600 hover:text-red-500 transition">
						Logout
					</a>
				{:else}
					<a href="/login" class="text-gray-700 hover:text-indigo-600 transition">
						Login
					</a>
					<a href="/register" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition">
						Register
					</a>
				{/if}
			</div>
		</div>
	</nav>
</header>
