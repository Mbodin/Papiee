<script lang="ts">
	import { getNotebookNode_unsafe, type NotebookState } from '$lib/notebook/structure';
	import NotebookAddMenu from './NotebookAddMenu.svelte';
	import RocqProvider from '../rocq/RocqProvider.svelte';
	import { array_position } from '$lib/notebook/position';

	import '$lib/notebook/nodes/nodes';
	import '$lib/notebook/widgets/widgets';
	import NotebookUpload from './NotebookUpload.svelte';
	import NotebookDownload from './NotebookDownload.svelte';
	import WidgetWindow from './widgets/WidgetWindow.svelte';
	import { m } from '$lib/paraglide/messages';
	import NotebookHandle from './NotebookHandle.svelte';

	let {
		notebook_state = $bindable({ title: '', children: [] }),
		mode
	}: { notebook_state?: NotebookState; mode: 'teacher' | 'student' } = $props();

	let anchored_i: number = $state(-1);

	let container: HTMLDivElement | undefined = $state();

	let global_position = $derived(
		array_position(
			notebook_state.children,
			(v) => (notebook_state = { ...notebook_state, children: v })
		)
	);

	function setAnchorNode(_node: HTMLElement | undefined, i?: number) {
		anchored_i = i == null ? -1 : i;
	}

	let article_nodes: HTMLElement[] = $state([]);

	// svelte-ignore non_reactive_update
	let version = 0; // Used to detect if update is called from a previously known version

	$effect(() => {
		notebook_state;
		version++;
	});
</script>

<RocqProvider>
	<div class="my-5 mt-5 flex h-full flex-col rounded-lg bg-surface-50-950">
		<div
			class="relative z-10 preset-filled-surface-400-600 before:pointer-events-none before:absolute before:-inset-4 before:rounded-lg before:border-16 before:border-surface-400-600"
		>
			<div class="flex flex-row gap-5 p-2 text-nowrap">
				<h5 class="">{m.title()}:</h5>
				<input
					type="text"
					class="m-0 input border-none ring-2 outline-none"
					bind:value={notebook_state.title}
				/>
			</div>
		</div>
		<div class="flex h-full w-full flex-row" bind:this={container}>
			<div class="relative h-full w-40 py-10">
				{#if anchored_i !== -1 && mode === 'teacher'}
					<div
						class="absolute flex w-full flex-row-reverse gap-1 px-5"
						style={`top: ${article_nodes[anchored_i].offsetTop - (container?.offsetTop || 0)}px`}
					>
						<NotebookAddMenu bind:notebook_state {anchored_i} />
						<NotebookHandle bind:notebook_state bind:anchored_i />
					</div>
				{/if}
			</div>
			<div class="flex h-full w-full flex-col gap-5 py-10">
				{#each notebook_state.children as node, i}
					{@const Component = getNotebookNode_unsafe(node.type).component}
					{@const thisAnchoredNode = (node: HTMLElement | undefined) => setAnchorNode(node, i)}
					{@const position = global_position.value?.index === i ? node.position : undefined}
					{@const local_version = version}
					<article bind:this={article_nodes[i]}>
						<Component
							value={{ ...node, position }}
							setAnchorNode={thisAnchoredNode}
							onNodeValueUpdate={(_, new_v) => {
								// If the notebook was updated and a update is called on the older version
								// Ignore the update
								if (local_version !== version) return;
								notebook_state.children[i] = new_v;
							}}
							isAnchored={() => anchored_i === i}
							{mode}
							position={[i]}
							root={notebook_state}
						/>
					</article>
				{/each}
			</div>
			<div class="h-full w-40"></div>
		</div>
		<div class="mx-20 my-2 flex flex-row justify-end gap-5">
			<NotebookUpload bind:notebook_state />
			<NotebookDownload {notebook_state} />
		</div>
	</div>

	<WidgetWindow />
</RocqProvider>
