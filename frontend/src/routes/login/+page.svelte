<script lang="ts">
	import { goto } from '$app/navigation';
	import { userStore } from '$lib/stores/userStore';
	import { login } from '$lib/api';
	import type { User } from '$lib/types';

	let email = '';
	let password = '';
	let error = '';
	let loading = false;

	async function handleSubmit(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		const { data, error: apiError } = await login(email, password);

		if (apiError) {
			error = apiError;
			loading = false;
			return;
		}

		userStore.login(data.user as User);
		
		// Store tokens in cookies via backend
		localStorage.setItem('accessToken', data.accessToken);
		localStorage.setItem('refreshToken', data.refreshToken);

		goto('/catalog');
	}
</script>

<svelte:head>
	<title>Login - Food Delivery</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Sign in to your account
			</h2>
		</div>
		<form class="mt-8 space-y-6" on:submit={handleSubmit}>
			<div class="rounded-md shadow-sm -space-y-px">
				<div>
					<label for="email" class="sr-only">Email address</label>
					<input
						id="email"
						name="email"
						type="email"
						autocomplete="email"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Email address"
						bind:value={email}
					/>
				</div>
				<div>
					<label for="password" class="sr-only">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="current-password"
						required
						class="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
						placeholder="Password"
						bind:value={password}
					/>
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
						Signing in...
					{:else}
						Sign in
					{/if}
				</button>
			</div>

			<div class="text-center">
				<a href="/register" class="font-medium text-indigo-600 hover:text-indigo-500">
					Don't have an account? Register
				</a>
			</div>
		</form>
	</div>
</div>
