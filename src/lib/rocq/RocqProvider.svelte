<script lang="ts">
	import { resolve } from '$app/paths';
	import { close, create, initialize, WORKER_CONTEXT, type RocqWorker } from '$lib/rocq/connection';
	import { Loader } from '@lucide/svelte';
	import { onMount, setContext, type Snippet } from 'svelte';

	import * as proto from 'vscode-languageserver-protocol';

	let {
		initialization_params = {},
		children
	}: { initialization_params?: Partial<proto.InitializeParams>; children?: Snippet } = $props();

	let worker: RocqWorker = $state({ connection: undefined });

	onMount(() => {
		setTimeout(async () => {
			let route = origin + resolve('/');
			route = route.endsWith('/') ? route.substring(0, route.length - 1) : route;
			worker.connection = await create(route).then(
				async (c) => await initialize(c, initialization_params)
			);
		});

		return () => (worker.connection ? close(worker.connection) : {});
	});

	setContext(WORKER_CONTEXT, worker);
</script>

{#if worker.connection != null}
	{@render children?.()}
{:else}
	<div
		class="bg-surface-0 my-5 mt-5 flex h-full flex-col rounded-lg bg-white p-20 text-neutral-950"
	>
		<div
			class="m-auto block max-w-md overflow-hidden card border-surface-900-100 preset-filled-surface-900-100 card-hover"
		>
			<article class="space-y-4 p-4">
				<div>
					<h2 class="h6 text-neutral-950">Loading ...</h2>
					<h3 class="h3 text-neutral-950">The worker is loading</h3>
				</div>

				<Loader class="m-auto animate-spin text-primary-500" size="128px" />
			</article>
		</div>
	</div>
{/if}
