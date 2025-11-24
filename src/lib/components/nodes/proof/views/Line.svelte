<script lang="ts" module>
	export const LineNodeView = (factory: NodeViewFactory) =>
		factory({
			component: Line,
			contentAs(node) {
				const div = document.createElement('div');
				div.className = 'flex flex-row';
				return div;
			}
		});
	export const plugins: Plugin[] = [];
</script>

<script lang="ts">
	import type { Plugin } from 'prosemirror-state';
	import Line from './Line.svelte';
	import { useNodeViewContext, type NodeViewFactory } from '@prosemirror-adapter/svelte';

	const contentRef = useNodeViewContext('contentRef');
</script>

<div class="line flex min-h-4 w-full flex-row py-3" use:contentRef></div>

<style>
	.line {
		word-break: break-all;
		text-wrap-mode: wrap;
		max-width: 90%;
	}

	:global(.line *) {
		white-space: pre;
	}
</style>
