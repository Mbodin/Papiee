<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	let { children }: { children: Snippet<[]> } = $props();

	let div: HTMLDivElement | undefined = $state(undefined);
	let element_size = $state({ width: 0, height: 0 });

	const RootAttachment: Attachment<HTMLDivElement> = (element) => {
		div = element;
		document.body.appendChild(element);
		document.addEventListener('mousemove', drag);
		document.addEventListener('mouseup', stopDrag);
		window.addEventListener('resize', onResize);

		onResize();
		return () => {
			element.remove();
			document.removeEventListener('mousemove', drag);
			document.removeEventListener('mouseup', stopDrag);
			window.removeEventListener('resize', onResize);
		};
	};

	let offset_height = $state(0);
	let document_size = $state({ width: 0, height: 0 });
	function onResize() {
		let header = document.body.querySelector('header');
		if (header?.getBoundingClientRect().top !== 0) header = null;
		offset_height = header?.clientHeight || 0;
		document_size = {
			width: document.body.clientWidth,
			height: document.body.clientHeight - offset_height
		};
	}

	let dragging = $state(false);
	let source = $state({ x: 0, y: 0 });
	let initial = $state({ x: 0, y: 0 });
	let drag_position = $state({ x: 1, y: 0 });

	let inbounds_position = $derived.by(() => {
		let { x, y } = drag_position;
		x = Math.max(x, 0);
		x = Math.min(x, 1 - element_size.width / document_size.width);

		y = Math.max(y, 0);
		y = Math.min(y, 1 - element_size.height / document_size.height);
		return { x, y };
	});

	function startDrag(e: MouseEvent) {
		source = {
			x: e.clientX / document_size.width,
			y: (e.clientY - offset_height) / document_size.height
		};
		initial = { x: inbounds_position.x, y: inbounds_position.y };
		dragging = true;
	}

	function drag(e: MouseEvent) {
		if (!dragging) return;

		let x = initial.x + e.clientX / document_size.width - source.x;
		let y = initial.y + (e.clientY - offset_height) / document_size.height - source.y;
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
	bind:clientWidth={element_size.width}
	bind:clientHeight={element_size.height}
	{@attach RootAttachment}
	class:dragging
	class="dragging fixed z-10 min-h-0 min-w-0 select-none"
	onmousedown={startDrag}
	style={`top: ${inbounds_position.y * document_size.height + offset_height}px; left: ${inbounds_position.x * document_size.width}px; transition: top 1s in`}
>
	{@render children()}
</div>

<style>
	:global(* .dragging) {
		user-select: none;
		cursor: grab;
	}
</style>
