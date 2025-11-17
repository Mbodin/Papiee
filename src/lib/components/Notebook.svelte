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

	let {
		notebook_state = $bindable({ title: '', children: [] }),
		mode
	}: { notebook_state?: NotebookState; mode: 'teacher' | 'student' } = $props();

	let anchor: HTMLElement | undefined = $state();
	let anchored_i: number = $state(-1);

	let container: HTMLDivElement | undefined = $state();

	let global_position = $derived(
		array_position(
			notebook_state.children,
			(v) => (notebook_state = { ...notebook_state, children: v })
		)
	);

	function setAnchorNode(node: HTMLElement | undefined, i?: number) {
		anchor = node;
		anchored_i = i == null ? -1 : i;
	}
</script>

<RocqProvider>
	<div class="bg-surface-0 my-5 mt-5 flex h-full flex-col rounded-lg bg-white text-neutral-950">
		<div class="notebook_header relative z-10 rounded-lg bg-surface-500">
			<div class="flex flex-row gap-5 p-2 text-nowrap">
				<h5 class="text-neutral-50">Title :</h5>
				<input
					type="text"
					class="input bg-white text-neutral-950"
					bind:value={notebook_state.title}
				/>
			</div>
		</div>
		<div class="flex h-full w-full flex-row scheme-dark" bind:this={container}>
			<div class="relative h-full w-40 py-10">
				{#if anchor && mode === 'teacher'}
					<div
						class="absolute flex w-full flex-row-reverse px-5"
						style={`top: ${anchor.offsetTop - (container?.offsetTop || 0)}px`}
					>
						<NotebookAddMenu bind:notebook_state {anchored_i} />
					</div>
				{/if}
			</div>
			<div class="flex h-full w-full flex-col gap-5 py-10">
				{#each notebook_state.children as node, i}
					{@const Component = getNotebookNode_unsafe(node.type).component}
					{@const thisAnchoredNode = (node: HTMLElement | undefined) => setAnchorNode(node, i)}
					{@const position = global_position.value?.index === i ? node.position : undefined}
					<Component
						value={{ ...node, position }}
						setAnchorNode={thisAnchoredNode}
						onNodeValueUpdate={(_, new_v) => {
							notebook_state.children[i] = new_v;
						}}
						isAnchored={() => anchored_i === i}
						{mode}
						position={[i]}
						root={notebook_state}
					/>
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

<style>
	:global(.notebook_header::before) {
		content: '';
		position: absolute;
		pointer-events: none;
		inset: -10px;
		border-radius: var(--radius-lg);
		border: solid 20px var(--color-surface-500);
	}
</style>
