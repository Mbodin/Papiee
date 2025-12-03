<script lang="ts">
	import type { SyntaxError } from '$lib/cnl/chunks/errors';
	import Latex from '$lib/components/Latex.svelte';
	import type { RocqStateProps } from '$lib/notebook/widgets/proof_state/state.svelte';

	let { value: rocq_state, error, hide }: RocqStateProps = $props();

	let goals = $derived(rocq_state?.goals);
	let goal = $derived(goals?.goals[0]);

	let hyps = $derived(goal?.hyps);

	let internals = $derived(
		hyps?.filter((v) => v.names[0].startsWith('__internal_name_')).map((v) => v.ty) || []
	);

	let sets = $derived([
		...new Set(internals.filter((v) => v.includes('\\in')).map((v) => v.split('\\in')[1].trim()))
	]);

	let values_by_sets = $derived(
		sets.map((set): [string, string[]] => [
			set,
			internals
				.filter((value) => value.includes('\\in'))
				.filter((value) => value.split('\\in')[1].trim() === set)
				.map((value) => value.split('\\in')[0].trim())
		])
	);
</script>

{#if hide !== true}
	<div class="min-w-20 rounded-t-md border-surface-600-400 bg-surface-600-400">
		<h4 class="mx-auto my-0 w-fit">Goal</h4>
	</div>
	<div class="rounded-b-md bg-white p-2 scheme-light">
		{#if error}
			<div class="rounded-md bg-red-500 p-2">
				{#if typeof error === 'object' && 'fatal' in error}
					Fatal Error
				{:else}
					{@const reason = (error as SyntaxError).reason}
					{reason}
				{/if}
			</div>
		{:else if rocq_state?.error}
			<div class="rounded-md bg-red-500 p-2">
				{rocq_state.error}
			</div>
		{:else}
			<div class="rounded-md border px-1 py-2">
				<ul>
					{#each values_by_sets as [set, values]}
						<li class="m-0 p-0 text-nowrap">
							<Latex value={values.join(',') + '\\in' + set} />
						</li>
					{/each}
				</ul>
			</div>

			<h4 class="text-nowrap">
				<Latex value={goal?.ty || ''} />
			</h4>{/if}
	</div>
{/if}
