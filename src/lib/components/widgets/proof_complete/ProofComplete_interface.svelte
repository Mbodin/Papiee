<script lang="ts" module>
	export function update_proofcomplete_command(view: EditorView) {
		const head = view.state.selection.$head;
		let chunk_begin = head;
		if (chunk_begin.node().type.name === schema.nodes.math.name)
			chunk_begin = chunk_begin.$before();
		chunk_begin = chunk_begin.$start();
		const node = chunk_begin.node();

		const chunks = (node?.attrs.value || []) as CnlChunk[];
		const chunk = getMainChunk(chunks) || chunks[0];

		const state = chunk?.state_before || ['START'];
		const content = fromChunkToString(node);
		const text = content.slice(0, head.pos - chunk_begin.pos);

		const predictions = predict(text, state) || [];
		const values = predictions.map(
			(v) => text + v.map((v) => (v.type === 'string' ? v.value : '[' + v.value + ']')).join('')
		);
		if (!view.hasFocus()) proof_complete_value.value = undefined;
		else
			proof_complete_value.value = {
				hide: proof_complete_value?.value?.hide == null ? true : proof_complete_value?.value?.hide,
				state: {
					selected: proof_complete_value.value?.state.selected || 0,
					view: view,
					from: chunk?.range?.startOffset || 0,
					to: text.length,
					value: values
				}
			};
	}

	export const plugins: Plugin[] = [
		new Plugin({
			view(view) {
				return {
					update(view, prevState) {
						update_proofcomplete_command(view);
						if (
							proof_complete_value.value &&
							fromTreeToTextual(fromSchemaToCnl(view.state.doc).root) !==
								fromTreeToTextual(fromSchemaToCnl(prevState.doc).root)
						) {
							proof_complete_value.value.hide = false;
						}
					}
				};
			}
		}),
		keymap({
			ArrowDown: (state, dispath, view) => {
				if (!proof_complete_value.value || proof_complete_value.value.state.value.length === 0)
					return false;
				const selected = proof_complete_value.value.state.selected;
				proof_complete_value.value = {
					hide: proof_complete_value.value.hide,
					state: {
						...proof_complete_value.value.state,
						selected: Math.min(selected + 1, proof_complete_value.value.state.value.length - 1)
					}
				};
				return true;
			},
			ArrowUp: (state, dispath, view) => {
				if (!proof_complete_value.value || proof_complete_value.value.state.value.length === 0)
					return false;
				const selected = proof_complete_value.value.state.selected;
				proof_complete_value.value = {
					hide: proof_complete_value.value.hide,
					state: {
						...proof_complete_value.value.state,
						selected: Math.max(selected - 1, 0)
					}
				};
				return true;
			},
			Enter: (state, dispath, view) => {
				if (!proof_complete_value.value || proof_complete_value.value.state.value.length === 0)
					return false;

				let head = state.selection.$head;
				let chunk_begin = head;
				if (chunk_begin.node().type.name === schema.nodes.math.name)
					chunk_begin = chunk_begin.$before();
				chunk_begin = chunk_begin.$start();

				const value = proof_complete_value.value.state.value;
				const selected = proof_complete_value.value.state.selected;

				if (dispath) {
					let tr = state.tr;
					tr = tr.replaceWith(head.$start().pos, head.pos, [schema.text(value[selected])]);
					tr = tr.setSelection(Selection.near(tr.doc.resolve(chunk_begin.pos).$end()));
					dispath(tr);
				}
				return true;
			},
			Escape: (state, dispath, view) => {
				if (!proof_complete_value.value || proof_complete_value.value.state.value.length === 0)
					return false;
				proof_complete_value.value = {
					hide: true,
					state: proof_complete_value.value.state
				};
				return true;
			},
			'Ctrl-Space': (state, dispatch, view) => {
				if (!proof_complete_value.value || proof_complete_value.value.state.value.length === 0)
					return false;
				proof_complete_value.value = {
					hide: false,
					state: proof_complete_value.value.state
				};
				return true;
			}
		})
	];
</script>

<script lang="ts">
	import Popup from '$lib/components/Popup.svelte';
	import {
		proof_complete_value,
		proof_complete_value_selector
	} from '$lib/notebook/widgets/proof_complete/state.svelte';
	import { keymap } from 'prosemirror-keymap';
	import ProofComplete from './ProofComplete.svelte';
	import { Plugin, Selection } from 'prosemirror-state';
	import { schema } from '$lib/notebook/nodes/proof/schema';
	import { predict } from '$lib/cnl/prediction';
	import type { CnlChunk } from '$lib/cnl/chunks/types';
	import { fromChunkToString, fromSchemaToCnl, getMainChunk } from '$lib/notebook/nodes/proof/cnl';
	import type { EditorView } from 'prosemirror-view';
	import { fromTreeToTextual } from '$lib/cnl/tree';

	let value = $derived(proof_complete_value.value);
</script>

{#if value && value.hide !== true && proof_complete_value_selector.value && value.state.value.length > 0}
	<Popup parent_anchor="bottom-left" selector={proof_complete_value_selector.value}>
		<ProofComplete {...value.state} />
	</Popup>
{/if}
