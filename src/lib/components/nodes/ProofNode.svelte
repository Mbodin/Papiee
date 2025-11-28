<script lang="ts">
	import { useProsemirrorAdapterProvider } from '@prosemirror-adapter/svelte';

	import type { NotebookNodeProps } from '$lib/notebook/nodes/types';
	import type { ProofNodeValue } from '$lib/notebook/nodes/proof/structure';
	import ProofEditor from './proof/ProofEditor.svelte';
	import type { EditorView } from 'prosemirror-view';
	import {
		fromCnlToSchema,
		fromProofNodeToRocq,
		fromSchemaToCnl
	} from '$lib/notebook/nodes/proof/cnl';
	import { fromTextualToTree, fromTreeToTextual } from '$lib/cnl/tree';
	import { lsp_getProofBeginState, getCodeBeforePosition } from '$lib/rocq/utils';
	import { getContext, onMount } from 'svelte';
	import { WORKER_CONTEXT, type RocqWorker } from '$lib/rocq/connection';
	import ProofNodeStateDisplayChip from './proof/ProofNodeStateDisplayChip.svelte';
	import { derived_trivial } from '$lib/svelte/derived.svelte';
	import { debounced_task } from '$lib/svelte/debounced.svelte';

	let {
		value,
		onNodeValueUpdate,
		setAnchorNode,
		isAnchored,
		root,
		position
	}: NotebookNodeProps<ProofNodeValue> = $props();

	useProsemirrorAdapterProvider();

	const worker = getContext<RocqWorker>(WORKER_CONTEXT);
	let connection = $derived(worker.connection);

	let _code_before = derived_trivial(() => getCodeBeforePosition(root, position));
	let code_before = $derived(_code_before.value);

	const debounced_updatestate = debounced_task(async (current_value: ProofNodeValue = value) => {
		if (!connection) return;
		const code = code_before + fromProofNodeToRocq(current_value);
		const result = await lsp_getProofBeginState(connection, code);

		onNodeValueUpdate(current_value, { ...current_value, state: result });
	}, 0);

	let cnl_value = {
		get value() {
			return fromCnlToSchema(fromTextualToTree(value.value), []);
		},
		set value(v) {
			const unparsed = fromTreeToTextual(fromSchemaToCnl(v).root);
			if (unparsed === value.value) return;

			const new_value: ProofNodeValue = {
				type: 'proof',
				position: value.position,
				initial_state: value.initial_state,
				value: unparsed,
				children: {},
				state: 'loading'
			};
			onNodeValueUpdate(value, new_value);
			debounced_updatestate(new_value);
		}
	};

	onMount(() => debounced_updatestate());

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
		display_goal={true}
		{root}
		{position}
		{value}
		{isAnchored}
	/>

	<div class="relative w-full">
		<ProofNodeStateDisplayChip state={value.state} />
	</div>
</div>
