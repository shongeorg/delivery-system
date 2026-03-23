<script lang="ts">
	interface Props {
		currentPage: number;
		lastPage: number;
		onPageChange: (page: number) => void;
	}

	let { currentPage, lastPage, onPageChange }: Props = $props();

	function goToPage(page: number) {
		if (page >= 1 && page <= lastPage && page !== currentPage) {
			onPageChange(page);
		}
	}
</script>

<div class="flex items-center justify-center gap-2 mt-8">
	<!-- First -->
	<button
		onclick={() => goToPage(1)}
		disabled={currentPage === 1}
		class="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
	>
		First
	</button>

	<!-- Previous -->
	<button
		onclick={() => goToPage(currentPage - 1)}
		disabled={currentPage === 1}
		class="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
	>
		&lt;
	</button>

	<!-- Page numbers -->
	{#each Array.from({ length: lastPage }, (_, i) => i + 1) as page}
		{#if page === 1 || page === lastPage || (page >= currentPage - 1 && page <= currentPage + 1)}
			<button
				onclick={() => goToPage(page)}
				class="px-3 py-1 rounded border {currentPage === page ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 bg-white hover:bg-gray-50'} text-sm"
			>
				{page}
			</button>
		{:else if page === currentPage - 2 || page === currentPage + 2}
			<span class="px-2 text-gray-500">...</span>
		{/if}
	{/each}

	<!-- Next -->
	<button
		onclick={() => goToPage(currentPage + 1)}
		disabled={currentPage === lastPage}
		class="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
	>
		&gt;
	</button>

	<!-- Last -->
	<button
		onclick={() => goToPage(lastPage)}
		disabled={currentPage === lastPage}
		class="px-3 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
	>
		Last
	</button>
</div>

<p class="text-center text-sm text-gray-600 mt-2">
	Page {currentPage} of {lastPage}
</p>
