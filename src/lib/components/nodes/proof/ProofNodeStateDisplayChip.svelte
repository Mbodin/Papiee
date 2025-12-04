<script lang="ts">
	import type { ProofNodeValue } from '$lib/notebook/nodes/proof/structure';
	import { CircleAlert, CircleCheck, CircleX, LoaderCircle } from '@lucide/svelte';

	let { state }: { state: ProofNodeValue['state'] } = $props();

	let value = $derived(state || 'none');
</script>

{#if value !== 'none'}
	<div
		class="proofnode-state absolute right-0 bottom-0 flex flex-row flex-nowrap items-center justify-center gap-1 rounded-lg p-2 text-sm select-none"
		data-state={value || 'loading'}
	>
		{#if value === 'admit'}
			<CircleAlert size="22px" /> Admitted
		{:else if value === 'error'}
			<CircleX size="22px" /> Error
		{:else if value === 'done'}
			<CircleCheck size="22px" /> Success
		{:else if (value || 'loading') === 'loading'}
			<LoaderCircle size="22px" class="animate-spin" /> Loading ...
		{:else if value === 'none'}{/if}
	</div>
{/if}

<style>
	.proofnode-state[data-state='done'] {
		background-color: var(--color-success-500);
		content: 'Success';
	}
	.proofnode-state[data-state='error'] {
		background-color: var(--color-error-500);
		content: 'Error';
	}
	.proofnode-state[data-state='admit'] {
		background-color: var(--color-warning-500);
		content: 'Admitted';
	}
	.proofnode-state[data-state='loading'] {
		background-color: var(--color-surface-50-950);
		content: 'Loading ...';
	}
</style>
