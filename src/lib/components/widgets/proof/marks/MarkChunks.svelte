<script lang="ts" module>
	import { Plugin } from 'prosemirror-state';
	import MarkChunks from './MarkChunks.svelte';
	import type { MarkViewFactory } from '@prosemirror-adapter/svelte';

	export const MarkChunksView = (factory: MarkViewFactory) =>
		factory({
			component: MarkChunks
		});
	export const plugins: Plugin[] = [
		new Plugin({
			view(view) {
				return {
					update(view, prevState) {
						if (unparse(prevState.doc) === unparse(view.state.doc)) return;
						command_parsechunk(view.state, view.dispatch);
					}
				};
			}
		})
	];
</script>

<script lang="ts">
	import { useMarkViewContext } from '@prosemirror-adapter/svelte';
	import { unparse } from '$lib/cnl/textual';
	import { command_parsechunk, type ProofChunk } from '$lib/notebook/widgets/proof/chunk';
	import { derived, get } from 'svelte/store';

	let id = $props.id();

	const contentRef = useMarkViewContext('contentRef');
	const _mark = useMarkViewContext('mark');

	const mark = $derived(get(_mark));
	const chunks = $derived(mark.attrs.value as ProofChunk[]);

	const chunk = $derived(chunks.find((v) => v.range.from !== v.range.to)!);
</script>

<span class="mark-chunks" data-type={chunk.type} use:contentRef></span>

<style>
	.mark-chunks {
		position: relative;
		display: inline-block;
		margin-left: 4px;
	}
</style>
