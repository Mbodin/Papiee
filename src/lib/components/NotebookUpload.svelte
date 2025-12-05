<script lang="ts">
	import { m } from '$lib/paraglide/messages';
	import type { NotebookState } from '$lib/notebook/structure';
	import { FileUpload, useFileUpload } from '@skeletonlabs/skeleton-svelte';

	let { notebook_state = $bindable() }: { notebook_state: NotebookState } = $props();

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
	<FileUpload.Trigger class="btn preset-filled-primary-600-400">{m.import()}</FileUpload.Trigger>
	<FileUpload.HiddenInput />
</FileUpload.Provider>
