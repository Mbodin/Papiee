<script lang="ts" module>
	export const LineNodeView = (factory: NodeViewFactory) =>
		factory({
			component: Line,
			as: 'div',
			contentAs: 'p'
		});
	export const plugins: Plugin[] = [];
</script>

<script lang="ts">
	import type { Plugin } from 'prosemirror-state';
	import Line from './Line.svelte';
	import { useNodeViewContext, type NodeViewFactory } from '@prosemirror-adapter/svelte';

	const contentRef = useNodeViewContext('contentRef');
</script>

<div class="min-h-4 border" use:contentRef></div>
