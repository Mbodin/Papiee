<script lang="ts">
	import { PlusIcon, FileTextIcon } from '@lucide/svelte';
	import { Popover, Portal, usePopover } from '@skeletonlabs/skeleton-svelte';

	let { addMarkdownNode }: { addMarkdownNode: () => void } = $props();
	const id = $props.id();
	const popover = usePopover({
		id: id,
		closeOnInteractOutside: true,
		positioning: { placement: 'right' }
	});
</script>

<Popover.Provider value={popover}>
	<Popover.Trigger class="btn-icon preset-filled bg-secondary-700-300">
		<PlusIcon size={15} />
	</Popover.Trigger>
	<Portal>
		<Popover.Positioner>
			<Popover.Content>
				<div
					class="max-w-md space-y-2 card border border-surface-500/30 bg-tertiary-200-800/30 p-2 shadow-xl backdrop-blur-sm"
				>
					<button
						onclick={() => {
							popover().setOpen(false);
							addMarkdownNode();
						}}
					>
						<div class="btn flex flex-row items-center gap-2 bg-secondary-300-700">
							<h4>Markdown</h4>
							<FileTextIcon />
						</div>
					</button>
				</div>
			</Popover.Content>
		</Popover.Positioner>
	</Portal>
</Popover.Provider>
