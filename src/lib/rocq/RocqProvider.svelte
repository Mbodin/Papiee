<script lang="ts">
	import { resolve } from '$app/paths';
	import LoaderDisplay, {
		compareStepsState,
		type LoaderState
	} from '$lib/components/LoaderDisplay.svelte';
	import { m } from '$lib/paraglide/messages';
	import { close, create, initialize, WORKER_CONTEXT, type RocqWorker } from '$lib/rocq/connection';
	import { absolute } from '$lib/route.svelte';
	import { Loader } from '@lucide/svelte';
	import { onMount, setContext, type Snippet } from 'svelte';

	import * as proto from 'vscode-languageserver-protocol';

	let {
		initialization_params = {},
		children
	}: { initialization_params?: Partial<proto.InitializeParams>; children?: Snippet } = $props();

	let worker: RocqWorker = $state({ connection: undefined });
	let loader_state: LoaderState = $state({ point: 0, step_i: 0 });
	let real_state = $state({ point: 0, step_i: 0 });
	let loader: LoaderDisplay | undefined = $state();

	let display_children = $state(false);

	onMount(() => {
		setTimeout(async () => {
			loader_state = { point: 0, step_i: 1 };
			const connection = await create(absolute(origin, ''));
			loader_state = { point: 0, step_i: 2 };
			await initialize(connection, initialization_params);
			loader_state = { point: 1, step_i: 2 };
			worker.connection = connection;

			setTimeout(() => {
				display_children = true;
			}, 2000);
		}, 500);

		return () => (worker.connection ? close(worker.connection) : {});
	});

	setContext(WORKER_CONTEXT, worker);
</script>

{#if worker.connection != null && display_children}
	{@render children?.()}
{:else}
	<div
		class="bg-surface-0 my-5 mt-5 flex h-full flex-col rounded-lg preset-filled-surface-50-950 p-20"
	>
		<div class="m-auto block max-w-md overflow-hidden card">
			<LoaderDisplay
				bind:this={loader}
				label={m['rocq_provider.loading._']()}
				steps={[
					{ key: 'rocq_provider.loading.steps.start', points: 1 },
					{ key: 'rocq_provider.loading.steps.create', points: 1 },
					{ key: 'rocq_provider.loading.steps.library', points: 1 }
				]}
				state={loader_state}
				bind:displayed_state={real_state}
			/>
		</div>
	</div>
{/if}
