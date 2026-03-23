<script lang="ts">
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/userStore';
	import { register } from '$lib/api';
	import type { User } from '$lib/types';

	let name = '';
	let email = '';
	let password = '';
	let confirmPassword = '';
	let phone = '';
	let address = '';
	let error = '';
	let loading = false;

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		loading = true;

		const { data, error: apiError } = await register(name, email, password, phone || undefined, address || undefined);

		if (apiError) {
			error = apiError;
			loading = false;
			return;
		}

		userStore.login(data.user as User);
		localStorage.setItem('accessToken', data.accessToken);
		localStorage.setItem('refreshToken', data.refreshToken);

		goto('/catalog');
	}
</script>

<svelte:head>
	<title>Register - Food Delivery</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Create your account
			</h2>
		</div>
		<form class="mt-8 space-y-6" on:submit={handleSubmit}>
			<div class="rounded-md shadow-sm -space-y-px">
				<div class="mb-4">
					<label for="name" class="sr-only">Name</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						placeholder="Full name"
						bind:value={name}
					/>
				</div>
				<div class="mb-4">
					<label for="email" class="sr-only">Email address</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						placeholder="Email address"
						bind:value={email}
					/>
				</div>
				<div class="mb-4">
					<label for="password" class="sr-only">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						placeholder="Password"
						bind:value={password}
					/>
				</div>
				<div class="mb-4">
					<label for="confirmPassword" class="sr-only">Confirm Password</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						required
						class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						placeholder="Confirm password"
						bind:value={confirmPassword}
					/>
				</div>
				<div class="mb-4">
					<label for="phone" class="sr-only">Phone</label>
					<input
						id="phone"
						name="phone"
						type="tel"
						class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						placeholder="Phone (optional)"
						bind:value={phone}
					/>
				</div>
				<div>
					<label for="address" class="sr-only">Address</label>
					<textarea
						id="address"
						name="address"
						rows="2"
						class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
						placeholder="Address (optional)"
						bind:value={address}
					></textarea>
				</div>
			</div>

			{#if error}
				<div class="text-red-500 text-sm text-center">{error}</div>
			{/if}

			<div>
				<button
					type="submit"
					disabled={loading}
					class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
				>
					{#if loading}
						Creating account...
					{:else}
						Register
					{/if}
				</button>
			</div>

			<div class="text-center">
				<a href="/login" class="font-medium text-indigo-600 hover:text-indigo-500">
					Already have an account? Sign in
				</a>
			</div>
		</form>
	</div>
</div>
