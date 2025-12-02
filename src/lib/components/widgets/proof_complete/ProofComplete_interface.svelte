<script lang="ts" module>
	export const plugins: Plugin[] = [
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

				const value = proof_complete_value.value.state.value;
				const selected = proof_complete_value.value.state.selected;

				let head = state.selection.$head;
				if (dispath) {
					let tr = state.tr;
					tr = tr.replaceWith(head.$start().pos, head.pos, [schema.text(value[selected])]);
					tr = tr.setSelection(
						Selection.near(tr.doc.resolve(head.$start().$increment(value[selected].length).pos))
					);
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
	import { proof_complete_value } from '$lib/notebook/widgets/proof_complete/state.svelte';
	import { keymap } from 'prosemirror-keymap';
	import ProofComplete from './ProofComplete.svelte';
	import { Selection, type Plugin } from 'prosemirror-state';
	import { schema } from '$lib/notebook/nodes/proof/schema';

	let value = $derived(proof_complete_value.value);
</script>

{#if value && !value.hide && value.state.value.length > 0}
	<Popup parent_anchor="bottom-left" selector={value.state.selector}>
		<ProofComplete {...value.state} />
	</Popup>
{/if}
