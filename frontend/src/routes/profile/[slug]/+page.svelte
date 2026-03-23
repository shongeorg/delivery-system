<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { getCurrentUser, updateCurrentUser } from '$lib/api';
	import { userStore } from '$lib/stores/userStore';
	import type { User } from '$lib/types';

	let user: User | null = null;
	let name = '';
	let email = '';
	let phone = '';
	let address = '';
	let loading = true;
	let updating = false;
	let error = '';
	let success = '';

	onMount(async () => {
		const res = await getCurrentUser();
		if (res.data) {
			user = res.data;
			name = user.name;
			email = user.email;
			phone = user.phone || '';
			address = user.address || '';
			userStore.login(user);
		} else {
			goto('/login');
		}
		loading = false;
	});

	async function handleUpdate(e: Event) {
		e.preventDefault();
		error = '';
		success = '';
		updating = true;

		const res = await updateCurrentUser({ name, phone, address });

		if (res.error) {
			error = res.error;
		} else if (res.data) {
			success = 'Profile updated successfully!';
			user = res.data;
			userStore.login(res.data);
		}

		updating = false;
	}
</script>

<svelte:head>
	<title>Profile - Food Delivery</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
		<h1 class="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

		{#if loading}
			<div class="text-center py-12">
				<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
			</div>
		{:else if user}
			<!-- Profile Card -->
			<div class="bg-white rounded-lg shadow p-6 mb-6">
				<div class="flex items-center space-x-4 mb-6">
					{#if user.cover}
						<img src={user.cover} alt={user.name} class="w-20 h-20 rounded-full object-cover" />
					{:else}
						<div class="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center text-2xl font-bold text-indigo-600">
							{name.charAt(0).toUpperCase()}
						</div>
					{/if}
					<div>
						<h2 class="text-2xl font-bold text-gray-900">{user.name}</h2>
						<p class="text-gray-600 capitalize">{user.role}</p>
					</div>
				</div>

				<form on:submit={handleUpdate}>
					<div class="space-y-4">
						<div>
							<label for="name" class="block text-sm font-medium text-gray-700 mb-2">
								Name
							</label>
							<input
								id="name"
								name="name"
								type="text"
								required
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
								bind:value={name}
							/>
						</div>

						<div>
							<label for="email" class="block text-sm font-medium text-gray-700 mb-2">
								Email
							</label>
							<input
								id="email"
								name="email"
								type="email"
								disabled
								value={email}
								class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 cursor-not-allowed"
							/>
							<p class="text-xs text-gray-500 mt-1">Email cannot be changed</p>
						</div>

						<div>
							<label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
								Phone
							</label>
							<input
								id="phone"
								name="phone"
								type="tel"
								value={phone}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="+1 (555) 123-4567"
								bind:value={phone}
							/>
						</div>

						<div>
							<label for="address" class="block text-sm font-medium text-gray-700 mb-2">
								Address
							</label>
							<textarea
								id="address"
								name="address"
								rows="3"
								value={address}
								class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
								placeholder="Your delivery address"
								bind:value={address}
							></textarea>
						</div>

						{#if error}
							<div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
								{error}
							</div>
						{/if}

						{#if success}
							<div class="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg">
								{success}
							</div>
						{/if}

						<button
							type="submit"
							disabled={updating}
							class="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
						>
							{#if updating}
								Updating...
							{:else}
								Update Profile
							{/if}
						</button>
					</div>
				</form>
			</div>

			<!-- Account Stats -->
			<div class="bg-white rounded-lg shadow p-6">
				<h3 class="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span class="text-gray-600">Member since:</span>
						<span class="font-medium">{new Date(user.createdAt!).toLocaleDateString()}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">User ID:</span>
						<span class="font-mono text-xs">{user.id}</span>
					</div>
					<div class="flex justify-between">
						<span class="text-gray-600">Slug:</span>
						<span class="font-medium">{user.slug}</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
