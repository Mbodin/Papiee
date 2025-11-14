<script lang="ts">
	import type { NotebookState } from '$lib/notebook/structure';
	import { FileUpload, useFileUpload } from '@skeletonlabs/skeleton-svelte';

	let { notebook_state }: { notebook_state: NotebookState } = $props();

	let id = $props.id();
	let fileUpload = useFileUpload({
		id,
		async onFileAccept(detail) {
			const [file] = detail.files;
			if (!file) return false;
			const value = await file.text();
			notebook_state = JSON.parse(value) as NotebookState;

			fileUpload().clearFiles();
		}
	});
</script>

<FileUpload.Provider value={fileUpload} class="w-fit">
	<FileUpload.Trigger class="btn bg-primary-500 text-neutral-50">Load</FileUpload.Trigger>
	<FileUpload.HiddenInput />
</FileUpload.Provider>
