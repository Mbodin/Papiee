<script lang="ts">
	import type { CompletionState } from '$lib/notebook/widgets/proof_complete/state.svelte';

	let { value, selected }: CompletionState = $props();

	let div: HTMLElement | undefined = $state();

	$effect(() => {
		if (!div) return;
		div.scrollIntoView({
			behavior: 'smooth',
			block: 'end'
		});
	});
</script>

<div
	class="mt-4 mr-2 max-h-80 overflow-x-scroll card border border-surface-500 bg-surface-50-950 px-2 py-1"
>
	{#each value as v, i}
		{#if selected === i}
			<div bind:this={div} class="rounded-md bg-surface-600-400 px-1 py-0.5">{v}</div>
		{:else}
			<div class="px-1 py-0.5">{v}</div>
		{/if}
	{/each}
</div>
