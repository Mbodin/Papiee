<script lang="ts">
	import type { SyntaxError } from '$lib/cnl/chunks/errors';
	import type { RocqStateProps } from '$lib/notebook/widgets/proof_state/state.svelte';

	let { value: rocq_state, error, hide }: RocqStateProps = $props();

	let goals = $derived(rocq_state?.goals);
	let goal = $derived(goals?.goals[0]);

	let hyps = $derived(goal?.hyps);
</script>

{#if hide !== true}
	<div class="min-w-20 rounded-t-md border-surface-600-400 bg-surface-600-400">
		<h4 class="mx-auto my-0 w-fit">Goal</h4>
	</div>
	<div class="rounded-b-md bg-white p-2">
		{#if error}
			<div class="rounded-md bg-red-500 p-2">
				{#if typeof error === 'object' && 'fatal' in error}
					Fatal Error
				{:else}
					{@const reason = (error as SyntaxError).reason}
					{reason}
				{/if}
			</div>
		{:else}
			<ul>
				{#each hyps as h}
					<li class="text-nowrap">
						{h.names.join(',')} : {h.ty}
					</li>
				{/each}
			</ul>

			<h4 class="text-nowrap">{goal?.ty}</h4>
		{/if}
	</div>
{/if}
