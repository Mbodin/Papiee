<script lang="ts">
	import type { SyntaxError } from '$lib/cnl/chunks/errors';
	import Latex from '$lib/components/Latex.svelte';
	import type { RocqStateProps } from '$lib/notebook/widgets/proof_state/state.svelte';
	import { fromPpToString } from '$lib/rocq/pp';
	import { Loader } from '@lucide/svelte';

	let { value: rocq_state, error, hide, loading }: RocqStateProps = $props();

	let goals = $derived(rocq_state?.goals);
	let goal = $derived(goals?.goals[0]);

	let hyps = $derived(goal?.hyps);

	let internals = $derived(
		hyps?.filter((v) => v.names[0].startsWith('__internal_name_')).map((v) => v.ty) || []
	);

	let sets = $derived([
		...new Set(
			internals
				.map(fromPpToString)
				.filter((v) => v.includes('\\in'))
				.map((v) => v.split('\\in')[1].trim())
		)
	]);

	let values_by_sets = $derived(
		sets.map((set): [string, string[]] => [
			set,
			internals
				.map(fromPpToString)
				.filter((value) => value.includes('\\in'))
				.filter((value) => value.split('\\in')[1].trim() === set)
				.map((value) => value.split('\\in')[0].trim())
		])
	);
</script>

{#if hide !== true}
	<section class="w-md rounded-md shadow-2xl" aria-live="polite">
		<header class="rounded-t-md bg-primary-500 text-center">
			<h3 class="h3 text-white">State</h3>
		</header>

		<div class="text-md flex min-h-10 flex-col gap-5 bg-white p-2 text-black scheme-light">
			{#if values_by_sets.length !== 0}
				<section>
					<header>
						<h5 class="text-black">Definitions :</h5>
					</header>

					<ul class="ml-10">
						{#each values_by_sets as [set, values]}
							<li class="li m-0 p-0 text-nowrap">
								<Latex value={values.join(',') + '\\in' + set} />
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if error || rocq_state?.error}
				<section class="card preset-filled-error-950-50 p-2">
					<header>Error</header>

					<p>
						{#if error}
							{#if typeof error === 'object' && 'fatal' in error}
								Fatal Error
							{:else}
								{@const reason = (error as SyntaxError).reason}
								{reason}
							{/if}
						{:else}
							{fromPpToString(rocq_state?.error || ['Pp_empty'])}
						{/if}
					</p>
				</section>
			{/if}
		</div>

		<footer class="rounded-b-md bg-secondary-50 p-2 text-sm scheme-light">
			{#if loading === true}
				<div>
					<Loader class="mx-auto animate-spin" />
				</div>
			{:else if goal?.ty != null}
				<h4 class="text-nowrap">
					<Latex value={fromPpToString(goal?.ty || ['Pp_empty'])} />
				</h4>
			{:else}
				<em class="italic">No goal currently found ...</em>
			{/if}
		</footer>
	</section>

	<!-- <div class="min-w-20 rounded-t-md border-surface-600-400 bg-surface-600-400">
		<h4 class="mx-auto my-0 w-fit">Goal</h4>
	</div>
	<div class="w-full rounded-b-md bg-white p-2 scheme-light">
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
	</div> -->
{/if}
