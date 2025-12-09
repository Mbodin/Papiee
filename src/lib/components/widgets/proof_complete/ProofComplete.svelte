<script lang="ts">
	import type { CompletionState } from '$lib/notebook/widgets/proof_complete/state.svelte';

	let { value, selected }: CompletionState = $props();
</script>

<div class="mt-4 card border border-surface-500 bg-surface-50-950 px-2 py-1">
	{#each value as v, i}
		{#if selected === i}
			<div class="mx-1 rounded-md bg-surface-50-950 px-1">{v}</div>
		{:else}
			<div class="mx-1 px-1">{v}</div>
		{/if}
	{/each}
</div>
