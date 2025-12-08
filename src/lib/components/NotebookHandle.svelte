<script lang="ts">
	import { type NotebookState } from '$lib/notebook/structure';
	import { GripVerticalIcon } from '@lucide/svelte';
	import { Popover, Portal, usePopover } from '@skeletonlabs/skeleton-svelte';

	let {
		notebook_state = $bindable(),
		anchored_i = $bindable()
	}: { notebook_state: NotebookState; anchored_i: number } = $props();
	const id = $props.id();
	const popover = usePopover({
		id: id,
		closeOnInteractOutside: true,
		positioning: { placement: 'right-start' }
	});

	function onNodeDelete() {
		notebook_state = {
			...notebook_state,
			children: [
				...notebook_state.children.slice(0, anchored_i),
				...notebook_state.children.slice(anchored_i + 1)
			]
		};
	}

	function onNodeMoveUp() {
		notebook_state = {
			...notebook_state,
			children: [
				...notebook_state.children.slice(0, anchored_i - 1),
				notebook_state.children[anchored_i],
				notebook_state.children[anchored_i - 1],
				...notebook_state.children.slice(anchored_i + 1)
			]
		};
		anchored_i = anchored_i - 1;
	}

	function onNodeMoveDown() {
		notebook_state = {
			...notebook_state,
			children: [
				...notebook_state.children.slice(0, anchored_i),
				notebook_state.children[anchored_i + 1],
				notebook_state.children[anchored_i],
				...notebook_state.children.slice(anchored_i + 2)
			]
		};
		anchored_i = anchored_i + 1;
	}
</script>

<Popover.Provider value={popover}>
	<Popover.Trigger class="btn-icon preset-filled bg-secondary-700-300">
		<GripVerticalIcon size={15} />
	</Popover.Trigger>
	<Portal>
		<Popover.Positioner>
			<Popover.Content>
				<div
					class="flex max-w-md flex-col space-y-2 card border border-surface-500/30 bg-tertiary-200-800/30 p-2 shadow-xl backdrop-blur-sm"
				>
					<button
						disabled={anchored_i === 0}
						onclick={() => {
							onNodeMoveUp();
						}}
					>
						<div class="btn flex flex-row items-center gap-2 bg-secondary-300-700">
							<h4>Move Up</h4>
						</div>
					</button>

					<button
						onclick={() => {
							onNodeDelete();
						}}
					>
						<div class="btn flex flex-row items-center gap-2 bg-secondary-300-700">
							<h4>Delete</h4>
						</div>
					</button>

					<button
						disabled={notebook_state.children.length - 1 === anchored_i}
						onclick={() => {
							onNodeMoveDown();
						}}
					>
						<div class="btn flex flex-row items-center gap-2 bg-secondary-300-700">
							<h4>Move Down</h4>
						</div>
					</button>
				</div>
			</Popover.Content>
		</Popover.Positioner>
	</Portal>
</Popover.Provider>
