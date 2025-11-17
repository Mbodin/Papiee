<script lang="ts">
	import type { QuestionNodeValue } from '$lib/notebook/nodes/question/structure';
	import type { NotebookNodeProps } from '$lib/notebook/nodes/types';
	import MarkdownNode from './MarkdownNode.svelte';
	import ProofNode from './ProofNode.svelte';
	import RocqNode from './RocqNode.svelte';

	let {
		value,
		onNodeValueUpdate,
		setAnchorNode: _setAnchorNode,
		isAnchored,
		mode,
		root,
		position
	}: NotebookNodeProps<QuestionNodeValue> = $props();

	function setAnchorNode() {
		_setAnchorNode(div);
	}

	let div: HTMLDivElement | undefined = $state();
</script>

<div bind:this={div} class="flex flex-col gap-5">
	<MarkdownNode
		{setAnchorNode}
		{isAnchored}
		{mode}
		value={{
			type: 'markdown',
			...value._markdown_header,
			position: value.position?.field === 'markdown_header' ? value.position.index : undefined
		}}
		onNodeValueUpdate={(_old_markdown, new_markdown) => {
			delete new_markdown.position;
			onNodeValueUpdate(value, {
				...value,
				_markdown_header: new_markdown,
				position: new_markdown.position
					? { field: 'markdown_header', index: new_markdown.position }
					: value.position
			});
		}}
		{root}
		position={[...position, 0]}
	/>

	<RocqNode
		{setAnchorNode}
		{isAnchored}
		{mode}
		value={{
			type: 'rocq',
			...value._rocq_header,
			position: value.position?.field === 'rocq_header' ? value.position.index : undefined
		}}
		onNodeValueUpdate={(_old_rocq, new_rocq) => {
			delete new_rocq.position;
			onNodeValueUpdate(value, {
				...value,
				_rocq_header: new_rocq,
				position: new_rocq.position
					? { field: 'rocq_header', index: new_rocq.position }
					: value.position
			});
		}}
		{root}
		position={[...position, 1]}
	/>

	<ProofNode
		{setAnchorNode}
		{isAnchored}
		{mode}
		value={{
			type: 'proof',
			...value._cnl_proof,
			position: value.position?.field === 'cnl_proof' ? value.position.index : undefined
		}}
		onNodeValueUpdate={(_old__cnl_proof, new__cnl_proof) => {
			delete new__cnl_proof.position;
			onNodeValueUpdate(value, {
				...value,
				_cnl_proof: new__cnl_proof,
				position: new__cnl_proof.position
					? { field: 'cnl_proof', index: new__cnl_proof.position }
					: value.position
			});
		}}
		{root}
		position={[...position, 2]}
	/>
</div>
