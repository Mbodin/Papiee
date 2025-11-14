<script lang="ts">
	import type { NotebookState } from '$lib/notebook/structure';
	import { Dialog, Portal, useDialog } from '@skeletonlabs/skeleton-svelte';

	let { notebook_state }: { notebook_state: NotebookState } = $props();

	let title = $state('');

	function reset_title() {
		let value = notebook_state.title.trim();
		if (value.length === 0) return 'exercise';
		value = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
		value = value.replaceAll(' ', '_');
		title = value;
	}

	let anode: HTMLElement | undefined = $state();

	let id = $props.id();
	let dialog = useDialog({
		id,
		closeOnInteractOutside: true,
		onOpenChange: (details) => {
			if (details.open) reset_title();
		}
	});
</script>

<Dialog.Provider value={dialog}>
	<Dialog.Trigger class="btn bg-primary-500 text-neutral-50">Save</Dialog.Trigger>
	<Portal>
		<Dialog.Backdrop class="fixed inset-0 z-50 bg-surface-50-950/50" />
		<Dialog.Positioner class="fixed inset-0 z-50 flex items-center justify-center">
			<Dialog.Content class="w-md space-y-2 card bg-surface-100-900 p-4 shadow-xl">
				<Dialog.Title class="text-2xl font-bold">Saving Notebook</Dialog.Title>
				<div class="flex flex-row items-center gap-5 text-nowrap">
					<h4>File name :</h4>
					<span class="flex flex-row">
						<input
							bind:value={title}
							class="input bg-surface-950 text-white"
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									e.preventDefault();
									anode?.click();
									dialog().setOpen(false);
								}
							}}
						/>
						<h5>.json</h5>
					</span>
				</div>
				<footer class="flex justify-end gap-2">
					<Dialog.CloseTrigger class="btn preset-tonal">Close</Dialog.CloseTrigger>

					<a
						bind:this={anode}
						download={title}
						href={URL.createObjectURL(
							new Blob([JSON.stringify(notebook_state)], { type: 'application/json' })
						)}
						><button
							class="btn bg-primary-500 text-neutral-50"
							onclick={() => dialog().setOpen(false)}>Save</button
						></a
					>
				</footer>
			</Dialog.Content>
		</Dialog.Positioner>
	</Portal>
</Dialog.Provider>
