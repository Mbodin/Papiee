<script lang="ts">
	import { useProsemirrorAdapterProvider } from '@prosemirror-adapter/svelte';

	import type { NotebookNodeProps } from '$lib/notebook/nodes/types';
	import type { ProofNodeValue } from '$lib/notebook/nodes/proof/structure';
	import { parse, unparse } from '$lib/cnl/textual';
	import ProofEditor from './proof/ProofEditor.svelte';
	import type { EditorView } from 'prosemirror-view';

	let { value, onNodeValueUpdate, setAnchorNode, isAnchored }: NotebookNodeProps<ProofNodeValue> =
		$props();

	useProsemirrorAdapterProvider();

	let cnl_value = {
		get value() {
			return parse(value.value);
		},
		set value(v) {
			if (unparse(v) === value.value) return;
			onNodeValueUpdate(value, {
				type: 'proof',
				position: value.position,
				value: unparse(v),
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
	<ProofEditor bind:node={cnl_value.value} {onView} display_goal={isAnchored()} />
</div>
