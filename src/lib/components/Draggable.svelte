<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	let { children }: { children: Snippet<[]> } = $props();

	let div: HTMLDivElement | undefined = $state(undefined);

	const RootAttachment: Attachment<HTMLDivElement> = (element) => {
		div = element;
		document.body.appendChild(element);
		document.addEventListener('mousemove', drag);
		document.addEventListener('mouseup', stopDrag);
		document.addEventListener('scroll', onScroll);
		return () => {
			element.remove();
			document.removeEventListener('scroll', onScroll);
			document.removeEventListener('mousemove', drag);
			document.removeEventListener('mouseup', stopDrag);
		};
	};

	let scroll_offset = $state({ x: 0, y: 0 });

	let dragging = $state(false);
	let source = $state({ x: 0, y: 0 });
	let initial = $state({ x: 0, y: 0 });
	let drag_position = $state({ x: Infinity, y: 0 });
	let width = $state(0);
	let height = $state(0);
	let inbounds_position = $derived.by(() => {
		let { x, y } = drag_position;
		x = Math.max(x, 0);
		x = Math.min(x, document.body.clientWidth - width);

		y = Math.max(y, 0);
		y = Math.min(y, document.body.clientHeight - height);
		return { x, y };
	});

	function startDrag(e: MouseEvent) {
		source = {
			x: e.clientX,
			y: e.clientY
		};
		initial = { x: inbounds_position.x, y: inbounds_position.y };
		dragging = true;
	}

	function onScroll() {
		scroll_offset.y = document.documentElement.scrollTop;
	}

	function drag(e: MouseEvent) {
		if (!dragging) return;

		let x = initial.x + e.clientX - source.x;
		let y = initial.y + e.clientY - source.y;
		drag_position = { x, y };
	}

	function stopDrag() {
		dragging = false;
		drag_position = { x: inbounds_position.x, y: inbounds_position.y };
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={div}
	bind:clientWidth={width}
	bind:clientHeight={height}
	{@attach RootAttachment}
	class:dragging
	class="dragging absolute min-h-0 min-w-0 select-none"
	onmousedown={startDrag}
	style={`top: ${inbounds_position.y + scroll_offset.y}px; left: ${inbounds_position.x}px; transition: top 1s in`}
>
	{@render children()}
</div>

<style>
	:global(* .dragging) {
		user-select: none;
		cursor: grab;
	}
</style>
