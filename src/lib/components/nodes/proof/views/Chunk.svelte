<script lang="ts" module>
	export const ChunkNodeView = (factory: NodeViewFactory) =>
		factory({
			component: Chunk
		});
	export const plugins: Plugin[] = [];
</script>

<script lang="ts">
	import type { Plugin } from 'prosemirror-state';
	import Chunk from './Chunk.svelte';
	import { useNodeViewContext, type NodeViewFactory } from '@prosemirror-adapter/svelte';
	import type { Node } from 'prosemirror-model';
	import type { CnlChunk } from '$lib/cnl/chunks/types';

	const contentRef = useNodeViewContext('contentRef');
	const node = useNodeViewContext('node');

	let node_value = $state(undefined as Node | undefined);
	node.subscribe((value) => (node_value = value));

	const chunks = $derived((node_value?.attrs.value || []) as CnlChunk[]);
	$inspect(chunks);

	const chunk = $derived(chunks?.find((v) => v.range.startOffset !== v.range.endOffset));
</script>

<div class="paragraph-line-chunk text-nowrap" data-type={chunk?.type} use:contentRef></div>

<style>
	.paragraph-line-chunk {
		position: relative;
		display: inline-block;
	}

	:global(.paragraph-line-chunk[data-type='tactic']) {
		--selected-border: black;
		--selected-background: rgba(0, 0, 0, 0.05);
		--unselected-border: black;
		--unselected-background: transparent;
	}
	:global(.paragraph-line-chunk[data-type='error']) {
		--selected-border: pink;
		--selected-background: rgba(255, 192, 203, 0.2);
		--unselected-border: red;
		--unselected-background: transparent;
	}
	:global(.paragraph-line-chunk[data-type='comment']) {
		--selected-border: gray;
		--selected-background: rgba(128, 128, 128, 0.2);
		--unselected-border: gray;
		--unselected-background: rgba(128, 128, 128, 0.2);
	}

	:global(.paragraph-line-chunk[data-type='comment']::before) {
		border-style: dashed;
	}

	:global(.paragraph-line-chunk::before) {
		content: '';
		position: absolute;
		inset: -5px;
		border-radius: 4px;
		border-width: 2px;
		pointer-events: none;
		border-style: solid;
		border-color: var(--unselected-border);
		background-color: var(--unselected-background);
	}
</style>
