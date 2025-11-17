<script lang="ts">
	import { getNotebookNodes, type NotebookState } from '$lib/notebook/structure';
	import type { NotebookNode } from '$lib/notebook/nodes/types';
	import { PlusIcon } from '@lucide/svelte';
	import { Popover, Portal, usePopover } from '@skeletonlabs/skeleton-svelte';
	import { type Component } from 'svelte';

	let {
		notebook_state = $bindable(),
		anchored_i
	}: { notebook_state: NotebookState; anchored_i: number } = $props();
	const id = $props.id();
	const popover = usePopover({
		id: id,
		closeOnInteractOutside: true,
		positioning: { placement: 'right-start' }
	});

	function addNode(node: NotebookNode) {
		const new_node = node.initial();
		let unfocused = notebook_state.children.map((v) => node.moveTo(v, undefined));

		notebook_state.children = [
			...unfocused.slice(0, anchored_i + 1),
			new_node,
			...unfocused.slice(anchored_i + 1)
		];

		const i = anchored_i + 1;

		setTimeout(() => {
			const begin = node.getBegin(new_node);
			notebook_state.children[i] = node.moveTo(new_node, begin);
		}, 20);
	}
</script>

<Popover.Provider value={popover}>
	<Popover.Trigger class="btn-icon preset-filled bg-secondary-700-300">
		<PlusIcon size={15} />
	</Popover.Trigger>
	<Portal>
		<Popover.Positioner>
			<Popover.Content>
				<div
					class="flex max-w-md flex-col space-y-2 card border border-surface-500/30 bg-tertiary-200-800/30 p-2 shadow-xl backdrop-blur-sm"
				>
					{#each getNotebookNodes(true) as (NotebookNode & { name: string; icon?: Component })[] as node}
						{@const Component = node.icon}
						<button
							onclick={() => {
								popover().setOpen(false);
								addNode(node);
							}}
						>
							<div class="btn flex flex-row items-center gap-2 bg-secondary-300-700">
								<h4>{node.name}</h4>
								{#if Component}
									<Component />
								{/if}
							</div>
						</button>
					{/each}
				</div>
			</Popover.Content>
		</Popover.Positioner>
	</Portal>
</Popover.Provider>
