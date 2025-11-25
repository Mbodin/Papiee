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
	import { extractRocqEndProofNodeState, getCodeBeforePosition } from '$lib/rocq/utils';
	import { getContext } from 'svelte';
	import { WORKER_CONTEXT, type RocqWorker } from '$lib/rocq/connection';
	import { Portal, Tooltip } from '@skeletonlabs/skeleton-svelte';
	import { CircleAlert, CircleCheck, CircleX, LoaderCircle } from '@lucide/svelte';
	import ProofNodeStateDisplayChip from './proof/ProofNodeStateDisplayChip.svelte';

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

	let timeout: NodeJS.Timeout | undefined = undefined;

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
			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(async () => {
				timeout = undefined;
				if (!connection) return;
				const value = getCodeBeforePosition(root, position) + fromProofNodeToRocq(new_value);
				const result = await extractRocqEndProofNodeState(connection, value);

				onNodeValueUpdate(new_value, { ...new_value, state: result });
			}, 1000);
		}
	};

	function onView(view: EditorView) {
		view.dom.addEventListener('focusin', () => {
			setAnchorNode(view.dom);
		});
	}
</script>

<div class="border-l-2 p-2">
	<ProofEditor bind:node={cnl_value.value} {onView} display_goal={true} {root} {position} {value} />

	<div class="relative w-full">
		<ProofNodeStateDisplayChip state={value.state} />
	</div>
</div>
