<script lang="ts" module>
	export const LineNodeView = (factory: NodeViewFactory) =>
		factory({
			component: Line,
			contentAs(node) {
				const div = document.createElement('div');
				div.className = 'flex flex-row';
				return div;
			}
		});
	export const plugins: Plugin[] = [
		keymap({
			ArrowLeft: (state, dispatch) => {
				const head = state.selection.$head;
				if (head.node().type.name === schema.nodes.math.name) return false;
				let aux_pos = head.$decrement();
				while (
					aux_pos.pos > 0 &&
					![schema.nodes.chunk.name, schema.nodes.math.name].includes(aux_pos.node().type.name)
				)
					aux_pos = aux_pos.$decrement();
				let tr = state.tr;
				tr = tr.setSelection(Selection.near(aux_pos, -1));
				if (dispatch) dispatch(tr);
				return dispatch != null;
			},
			ArrowRight: (state, dispatch) => {
				const head = state.selection.$head;
				if (head.node().type.name === schema.nodes.math.name) return false;
				let aux_pos = head;
				while (
					aux_pos.pos < state.doc.content.size &&
					(schema.nodes.chunk.name !== aux_pos.node().type.name || aux_pos.end() === aux_pos.pos) &&
					(schema.nodes.math.name !== aux_pos.node().type.name || aux_pos.end() === aux_pos.pos) &&
					aux_pos.node().childCount > 0
				) {
					aux_pos = aux_pos.$increment();
				}

				aux_pos = aux_pos.pos < state.doc.content.size - 1 ? aux_pos.$increment() : aux_pos;

				try {
					let tr = state.tr;
					tr = tr.setSelection(Selection.near(aux_pos, 1));
					if (dispatch) dispatch(tr);
					return true;
				} catch (_e) {}

				return true;
			}
		})
	];
</script>

<script lang="ts">
	import { Selection, TextSelection, type Plugin } from 'prosemirror-state';
	import Line from './Line.svelte';
	import { useNodeViewContext, type NodeViewFactory } from '@prosemirror-adapter/svelte';
	import { keymap } from 'prosemirror-keymap';
	import { schema } from '$lib/notebook/nodes/proof/schema';

	const contentRef = useNodeViewContext('contentRef');
</script>

<div class="line flex min-h-4 w-full flex-row" use:contentRef></div>

<style>
	.line {
		word-break: break-all;
		text-wrap-mode: wrap;
		max-width: 90%;
	}

	:global(.line *) {
		white-space: pre;
	}
</style>
