<script lang="ts">
	import { fromAnchorToRealPoint, type InbeetweenAnchorPoint } from '$lib/types/anchor';
	import type { Anchor } from '@lucide/svelte';
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	let {
		selector,
		parent_anchor,
		children_anchor = 'top-left',
		children
	}: {
		selector: string;
		parent_anchor: InbeetweenAnchorPoint;
		children_anchor?: InbeetweenAnchorPoint;
		children: Snippet<[]>;
	} = $props();

	let visual_parent: Element | undefined = $state();
	let position: { x: number; y: number } = $state({ x: 0, y: 0 });

	$effect(() => {
		visual_parent = document.querySelector(selector) || undefined;
	});

	$effect(() => {
		if (!visual_parent || !div) return;

		const parent = visual_parent.getBoundingClientRect();
		const parent_dx = parent.width / 2;
		const parent_dy = -parent.height / 2;

		const child_dx = element_size.width / 2;
		const child_dy = -element_size.height / 2;

		const parent_relative = fromAnchorToRealPoint(parent_anchor);
		const child_relative = fromAnchorToRealPoint(children_anchor);

		position = {
			x:
				window.scrollX +
				(parent.x + (parent_relative.x + 1) * parent_dx - (child_relative.x + 1) * child_dx) /
					document_size.width,
			y:
				window.scrollY +
				(parent.y + (parent_relative.y + 1) * parent_dy - child_relative.y * child_dy) /
					document_size.height
		};
	});

	let document_size = $state({ width: 0, height: 0 });
	function onResize() {
		document_size = {
			width: document.body.clientWidth,
			height: document.body.clientHeight
		};
	}

	function onResizeVisualParent() {
		const parent = visual_parent?.getBoundingClientRect();
		parent_size = {
			width: visual_parent?.clientWidth || 0,
			height: visual_parent?.clientHeight || 0
		};

		parent_position = {
			x: parent?.left || 0,
			y: parent?.top || 0
		};
	}

	let div: HTMLDivElement | undefined = $state(undefined);

	const RootAttachment: Attachment<HTMLDivElement> = (element) => {
		div = element;
		document.body.appendChild(element);
		window.addEventListener('resize', onResize);

		onResize();
		return () => {
			element.remove();
			window.removeEventListener('resize', onResize);
		};
	};

	$effect(() => {
		if (!visual_parent) return;
		visual_parent.addEventListener('resize', onResizeVisualParent);

		return () => {
			visual_parent?.removeEventListener('resize', onResizeVisualParent);
		};
	});

	let element_size = $state({ width: 0, height: 0 });
	let parent_size = $state({ width: 0, height: 0 });
	let parent_position = $state({ x: 0, y: 0 });
	let inbounds_position = $derived.by(() => {
		let { x, y } = position;
		x = Math.max(x, 0);
		x = Math.min(x, 1 - element_size.width / document_size.width);

		y = Math.max(y, 0);
		y = Math.min(y, 1 - element_size.height / document_size.height);
		return { x, y };
	});
</script>

{#if visual_parent}
	<div
		bind:this={div}
		bind:clientWidth={element_size.width}
		bind:clientHeight={element_size.height}
		{@attach RootAttachment}
		class="absolute z-10 min-h-0 min-w-0 text-black select-none"
		style={`top: ${inbounds_position.y * document_size.height}px; left: ${inbounds_position.x * document_size.width}px; transition: top 1s in`}
	>
		{@render children()}
	</div>
{/if}
