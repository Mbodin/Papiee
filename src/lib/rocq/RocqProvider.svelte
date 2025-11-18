<script lang="ts">
	import { resolve } from '$app/paths';
	import { close, create, initialize, WORKER_CONTEXT, type RocqWorker } from '$lib/rocq/connection';
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

{@render children?.()}
