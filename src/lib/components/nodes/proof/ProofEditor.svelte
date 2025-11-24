<script lang="ts">
	import { useMarkViewFactory, useNodeViewFactory } from '@prosemirror-adapter/svelte';
	import { EditorState, Plugin, Selection, Transaction } from 'prosemirror-state';
	import { EditorView } from 'prosemirror-view';
	import { ParagraphNodeView, plugins as paragraph_plugins } from './views/Paragraph.svelte';
	import { Slice, type Node } from 'prosemirror-model';
	import { DocNodeView, plugins as doc_plugins } from './views/Doc.svelte';
	import { LineNodeView, plugins as line_plugins } from './views/Line.svelte';
	import '$lib/resolvedpos';
	import { schema } from '$lib/notebook/nodes/proof/schema';

	import '$lib/cnl/tactics';
	import type { CompletionState } from './ProofAutoCompletion.svelte';
	import ProofAutoCompletion from './ProofAutoCompletion.svelte';
	import { proof_state_value } from '$lib/notebook/widgets/proof_state/state.svelte';
	import type { NotebookState } from '$lib/notebook/structure';
	import {
		assembleCodeFromChunks,
		extractRocqEndProofState,
		getCodeBeforePosition
	} from '$lib/rocq/utils';
	import type { RocqEndProofState } from '$lib/notebook/nodes/rocq/structure';
	import { getContext } from 'svelte';
	import { type RocqWorker, WORKER_CONTEXT } from '$lib/rocq/connection';
	import { FileWarning } from '@lucide/svelte';
	import type { CnlChunk } from '$lib/cnl/chunks/types';
	import { ContentNodeView, plugins as content_plugins } from './views/Content.svelte';
	import {
		fromCnlToSchema,
		fromSchemaToCnl,
		getNewSelectionPosition
	} from '$lib/notebook/nodes/proof/cnl';
	import { newCnlParser } from '$lib/cnl/chunks/parser';
	import { getTactics } from '$lib/cnl/cnl_tactic';
	import type { ProofNodeValue } from '$lib/notebook/nodes/proof/structure';
	import { ChunkNodeView, plugins as chunk_plugins } from './views/Chunk.svelte';
	import { fromTreeToTextual } from '$lib/cnl/tree';

	let {
		node = $bindable(),
		onView,
		display_goal,
		root,
		position,
		value
	}: {
		node?: Node;
		onView?: (view: EditorView) => void;
		display_goal: boolean;
		root: NotebookState;
		position: number[];
		value: ProofNodeValue;
	} = $props();

	const nodeViewFactory = useNodeViewFactory();

	let view: EditorView | undefined = $state();
	let selected: number | -1 = $state(-1);
	let chunks: CnlChunk[] = $state([]);

	const editor = (element: HTMLElement) => {
		const editor_state = EditorState.create({
			schema,
			plugins: [
				new Plugin({
					view() {
						return {
							update(view, prevState) {
								node = view.state.doc;
							}
						};
					}
				}),
				chunk_plugins
				// paragraph_plugins,
				// doc_plugins,
				// line_plugins,
				// content_plugins
			].flat()
		});
		view = new EditorView(element, {
			state: editor_state,
			nodeViews: {
				paragraph: ParagraphNodeView(nodeViewFactory),
				doc: DocNodeView(nodeViewFactory),
				line: LineNodeView(nodeViewFactory),
				content: ContentNodeView(nodeViewFactory),
				chunk: ChunkNodeView(nodeViewFactory)
			},

			attributes(state) {
				return { spellcheck: 'false' };
			},

			dispatchTransaction(tr) {
				const cnl = fromSchemaToCnl(tr.doc);
				const chunks = newCnlParser(getTactics(), value.initial_state)(cnl.root);

				if (JSON.stringify(cnl.chunks) !== JSON.stringify(chunks)) {
					const head = tr.selection.$head;
					tr = tr.replaceRangeWith(0, tr.doc.content.size - 1, fromCnlToSchema(cnl.root, chunks));
					tr = tr.setSelection(Selection.near(getNewSelectionPosition(view!.state, head, tr.doc)));
				}
				const state = view!.state.apply(tr);

				view!.updateState(state);
			},

			// As long a copy/paste is broken prevent it
			transformCopied(slice, view) {
				return Slice.empty;
			},

			transformPasted(slice, view, plain) {
				return Slice.empty;
			}
		});

		$effect(() => {
			if (!view) return;
			if (
				node &&
				fromTreeToTextual(fromSchemaToCnl(node).root) !==
					fromTreeToTextual(fromSchemaToCnl(node).root)
			) {
				const head = view!.state.selection.head;
				let tr = view.state.tr;
				tr = tr.replaceRangeWith(0, view!.state.doc.content.size - 1, node);
				tr = tr.setSelection(Selection.near(tr.doc.resolve(head)));
				view!.dispatch(tr);
			}
		});
		if (onView) onView(view);
	};

	let completion: CompletionState | undefined = $state();
	let code: string = $state('');

	$effect(() => {
		const selected_chunk = chunks[selected];
		if (!view || selected_chunk == null || proof_end_state != 'accessible') {
			proof_state_value.value = undefined;
		} else {
			const code = assembleCodeFromChunks(root, chunks, selected, position);
			proof_state_value.value = {
				code,
				hide: !display_goal,
				error: selected_chunk.type === 'error' ? selected_chunk : undefined
			};
		}
	});

	let proof_end_state: RocqEndProofState = $state('nothing');

	const worker = getContext<RocqWorker>(WORKER_CONTEXT);
	let connection = $derived(worker.connection);
	$effect(() => {
		if (!connection) proof_end_state = 'nothing';
		else
			extractRocqEndProofState(connection, getCodeBeforePosition(root, position)).then(
				(v) => (proof_end_state = v)
			);
	});
</script>

{#if proof_end_state == 'nothing'}
	<h4 class="flex w-full flex-row items-center gap-2 text-nowrap text-error-50-950">
		<FileWarning /> No rocq proof was found in rocq file
	</h4>
{/if}
{#if view}
	<ProofAutoCompletion {view} {completion} />
{/if}
<div class="ProseMirror" use:editor></div>

<style>
	:global(.ProseMirror:focus) {
		outline: none;
	}

	.ProseMirror {
		font-family: inherit;
		--selection-bg: color-mix(in srgb, Highlight 20%, transparent);
		--selection-fg: HighlightText;
	}

	:global(.ProseMirror-focused .selected-text) {
		background: Highlight;
	}

	:global(.ProseMirror:focus) {
		outline: none;
	}

	:global(.paragraph-content) {
		margin-left: 5px;
	}
</style>
