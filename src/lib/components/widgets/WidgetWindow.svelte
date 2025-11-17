<script lang="ts">
	import { getWidgets } from '$lib/notebook/widgets';
	import type { Attachment } from 'svelte/attachments';

	let div: HTMLDivElement | undefined = $state(undefined);

	const RootAttachment: Attachment<HTMLDivElement> = (element) => {
		div = element;
		document.body.appendChild(element);
		return () => {
			element.remove();
		};
	};
</script>

<div bind:this={div} {@attach RootAttachment} class="absolute min-h-0 min-w-0 select-none">
	{#each getWidgets() as Component}
		<Component />
	{/each}
</div>
