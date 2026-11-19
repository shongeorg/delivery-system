<script lang="ts">
	import { toast } from '$lib/stores/toast';

	let state = $state({ message: '', type: 'success' as 'success' | 'error', visible: false });

	toast.subscribe((value) => {
		state = value;
	});
</script>

{#if state.visible}
	<div
		class="fixed bottom-6 right-6 z-50 max-w-sm rounded-lg px-5 py-3 shadow-lg text-white {state.type ===
		'error'
			? 'bg-red-600'
			: 'bg-green-600'}"
		role="status"
	>
		{state.message}
	</div>
{/if}
