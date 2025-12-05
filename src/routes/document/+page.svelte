<script lang="ts">
	import Notebook from '$lib/components/Notebook.svelte';
	import type { NotebookState } from '$lib/notebook/structure';
	import { PROOF_NODE } from '$lib/notebook/nodes/proof/structure';
	import { ROCQ_NODE } from '$lib/notebook/nodes/rocq/structure';

	let notebook_state: NotebookState = $state({
		children: [ROCQ_NODE.initial(), PROOF_NODE.initial()],
		title: ''
	});

	let teacher_viewing = $state(true);
</script>

<div class="mx-auto h-full w-9/12">
	<Notebook bind:notebook_state mode={teacher_viewing ? 'teacher' : 'student'} />
	<button
		class="btn preset-filled-primary-400-600"
		onclick={() => (teacher_viewing = !teacher_viewing)}>Change mode</button
	>
</div>
