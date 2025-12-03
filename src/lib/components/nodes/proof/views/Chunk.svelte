<script lang="ts" module>
	export const ChunkNodeView = (factory: NodeViewFactory) =>
		factory({
			component: Chunk
		});
	export const plugins: Plugin[] = [
		new Plugin({
			appendTransaction(_transactions, _oldState, newState) {
				const previously_selected_chunks: { pos: number; node: Node }[] = [];
				let head_selected: { pos: number; node: Node } | undefined;

				const head = newState.selection.$head;
				newState.doc.nodesBetween(0, newState.doc.content.size, (node, pos) => {
					if (node.type.name === schema.nodes.chunk.name) {
						if (head.pos >= pos) {
							head_selected = { pos, node };
						}
						const selected = node.attrs.selected as boolean;
						if (selected === true) {
							previously_selected_chunks.push({ pos, node });
						}
					}
				});

				if (!head_selected) return undefined;

				if (
					previously_selected_chunks.length === 1 &&
					previously_selected_chunks[0].pos === head_selected?.pos
				)
					return undefined;
				let tr = undefined as Transaction | undefined;
				previously_selected_chunks.concat(head_selected).forEach(({ pos: _pos, node }) => {
					if (node.attrs.selected === (_pos === head_selected?.pos)) return;

					if (!tr) tr = newState.tr;
					tr = tr.setNodeAttribute(_pos, 'selected', _pos === head_selected?.pos);
				});

				return tr;
			}
		})
	];
</script>

<script lang="ts">
	import { Plugin, Transaction } from 'prosemirror-state';
	import Chunk from './Chunk.svelte';
	import { useNodeViewContext, type NodeViewFactory } from '@prosemirror-adapter/svelte';
	import { type Node } from 'prosemirror-model';
	import type { CnlChunk } from '$lib/cnl/chunks/types';
	import { schema } from '$lib/notebook/nodes/proof/schema';
	import { proof_complete_value } from '$lib/notebook/widgets/proof_complete/state.svelte';

	const contentRef = useNodeViewContext('contentRef');
	const node = useNodeViewContext('node');
	const view = useNodeViewContext('view');

	let node_value = $state(undefined as Node | undefined);
	node.subscribe((value) => (node_value = value));

	const chunks = $derived((node_value?.attrs.value || []) as CnlChunk[]);
	const chunk = $derived(chunks?.find((v) => v.range.startOffset !== v.range.endOffset));

	const selected = $derived((node_value?.attrs.selected as boolean) || false);

	let id = $props.id();

	$effect(() => {
		if (!selected || !chunk) return;

		// We need to wait for hydration because if the element does not exist the popup will not be able to render
		setTimeout(() => {
			if (proof_complete_value.value?.state.selector === '#' + id) return;
			proof_complete_value.value = {
				state: {
					from: chunk.range.startOffset,
					to: chunk.range.endOffset,
					selector: '#' + id,
					value: ['intros d.', 'simpl.'],
					view: view,
					selected: 0
				},
				hide: false
			};
		}, 10);
	});
</script>

<div
	{id}
	class="paragraph-line-chunk text-nowrap"
	data-type={chunk?.type}
	class:selected
	use:contentRef
></div>

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

	:global(.paragraph-line-chunk[data-type='error']::before),
	:global(.paragraph-line-chunk.selected::before) {
		content: '';
		position: absolute;
		inset: 0px;
		border-width: 2px;
		pointer-events: none;
		border-style: solid;
		border-color: var(--unselected-border);
		border-top: 0;
		border-left: 0;
		border-right: 0;
		background-color: var(--unselected-background);
	}
</style>
