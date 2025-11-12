<script lang="ts">
	import Notebook from '$lib/components/Notebook.svelte';
	import type { NotebookState } from '$lib/notebook/structure';
	import { QUESTION_WIDGET } from '$lib/notebook/widgets/question/structure';

	let notebook_state: NotebookState = $state([QUESTION_WIDGET.initial()]);

	$inspect(notebook_state);
</script>

<div class="mx-auto h-full w-9/12">
	<Notebook bind:notebook_state />
</div>
