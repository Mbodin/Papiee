<script lang="ts">
	import { useProsemirrorAdapterProvider } from '@prosemirror-adapter/svelte';

	import type { NotebookNodeProps } from '$lib/notebook/nodes/types';
	import type { ProofNodeValue } from '$lib/notebook/nodes/proof/structure';
	import ProofEditor from './proof/ProofEditor.svelte';
	import type { EditorView } from 'prosemirror-view';
	import { fromCnlToSchema, fromSchemaToCnl } from '$lib/notebook/nodes/proof/cnl';
	import { fromTextualToTree, fromTreeToTextual } from '$lib/cnl/tree';

	let {
		value,
		onNodeValueUpdate,
		setAnchorNode,
		isAnchored,
		root,
		position
	}: NotebookNodeProps<ProofNodeValue> = $props();

	useProsemirrorAdapterProvider();

	let cnl_value = {
		get value() {
			return fromCnlToSchema(fromTextualToTree(value.value), []);
		},
		set value(v) {
			const unparsed = fromTreeToTextual(fromSchemaToCnl(v).root);
			if (unparsed === value.value) return;
			onNodeValueUpdate(value, {
				type: 'proof',
				position: value.position,
				initial_state: value.initial_state,
				value: unparsed,
				children: {}
			});
		}
	};

	function onView(view: EditorView) {
		view.dom.addEventListener('focusin', () => {
			setAnchorNode(view.dom);
		});
	}
</script>

<div class="border-l-2 p-2">
	<ProofEditor
		bind:node={cnl_value.value}
		{onView}
		display_goal={isAnchored()}
		{root}
		{position}
		{value}
	/>
</div>
