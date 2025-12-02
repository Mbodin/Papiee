<script lang="ts">
	import { useNodeViewFactory } from '@prosemirror-adapter/svelte';
	import { EditorState, Plugin, Selection } from 'prosemirror-state';
	import { EditorView } from 'prosemirror-view';
	import { ParagraphNodeView, plugins as paragraph_plugins } from './views/Paragraph.svelte';
	import { Slice, type Node } from 'prosemirror-model';
	import { DocNodeView, plugins as doc_plugins } from './views/Doc.svelte';
	import { LineNodeView, plugins as line_plugins } from './views/Line.svelte';
	import '$lib/resolvedpos';
	import { schema } from '$lib/notebook/nodes/proof/schema';

	import '$lib/cnl/tactics';
	import { proof_state_value } from '$lib/notebook/widgets/proof_state/state.svelte';
	import type { NotebookState } from '$lib/notebook/structure';
	import {
		assembleCodeFromChunks,
		lsp_getProofEndState,
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
	import { debounced_task } from '$lib/svelte/debounced.svelte';
	import { value_derived_trivial } from '$lib/svelte/derived.svelte';
	import { plugins as math_plugins, MathLiveNodeView } from './views/Math';
	import { proof_complete_value } from '$lib/notebook/widgets/proof_complete/state.svelte';
	import { plugins as complete_plugins } from '$lib/components/widgets/proof_complete/ProofComplete_interface.svelte';

	let {
		node = $bindable(),
		onView,
		display_goal,
		root,
		position,
		value,
		isAnchored
	}: {
		node?: Node;
		onView?: (view: EditorView) => void;
		display_goal: boolean;
		root: NotebookState;
		position: number[];
		value: ProofNodeValue;
		isAnchored: () => boolean;
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
				complete_plugins,
				chunk_plugins,
				paragraph_plugins,
				doc_plugins,
				line_plugins,
				content_plugins,
				math_plugins
			].flat()
		});
		view = new EditorView(element, {
			state: editor_state,
			nodeViews: {
				paragraph: ParagraphNodeView(nodeViewFactory),
				doc: DocNodeView(nodeViewFactory),
				line: LineNodeView(nodeViewFactory),
				content: ContentNodeView(nodeViewFactory),
				chunk: ChunkNodeView(nodeViewFactory),
				math: (node, view, getPos, decorations, innerDecorations) =>
					new MathLiveNodeView(node, view, getPos, decorations, innerDecorations)
			},

			attributes(state) {
				return { spellcheck: 'false' };
			},

			dispatchTransaction(tr) {
				const cnl = fromSchemaToCnl(tr.doc);
				const newly_parsed = newCnlParser(getTactics(), value.initial_state)(cnl.root);

				if (JSON.stringify(cnl.chunks) !== JSON.stringify(newly_parsed)) {
					const head = tr.selection.$head;
					tr = tr.replaceRangeWith(
						0,
						tr.doc.content.size - 1,
						fromCnlToSchema(cnl.root, newly_parsed)
					);
					tr = tr.setSelection(Selection.near(getNewSelectionPosition(view!.state, head, tr.doc)));
				}
				const state = view!.state.apply(tr);

				{
					const head = tr.selection.$head;
					let _selected = 0;
					tr.doc.nodesBetween(0, head.before(), (node) => {
						if (node.type.name === schema.nodes.chunk.name) {
							_selected += node.attrs?.value?.length || 0;
						}
					});
					selected = _selected;
					chunks = newly_parsed;
				}

				view!.updateState(state);
			},

			handleClick(view, pos, event) {},

			// As long a copy/paste is broken prevent it
			transformCopied(slice, view) {
				return Slice.empty;
			},

			transformPasted(slice, view, plain) {
				return Slice.empty;
			},

			handleDOMEvents: {
				focus(view, event) {
					const head = view.state.selection.$head;
					let _selected = 0;
					view.state.doc.nodesBetween(0, head.before(), (node) => {
						if (node.type.name === schema.nodes.chunk.name) {
							_selected += node.attrs?.value?.length || 0;
						}
					});
					selected = _selected;
					chunks = chunks;
					debounced_updateproofstate();
				},
				focusout(view, event) {
					// proof_complete_value.value = undefined;
				}
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

	const debounced_updateproofstate = debounced_task(() => {
		if (!isAnchored()) return;
		const selected_chunk = chunks[selected];
		if (!view || (proof_end_state != 'accessible' && proof_end_state != 'open')) {
			proof_state_value.value = undefined;
		} else {
			const code = assembleCodeFromChunks(root, chunks, selected, position);
			proof_state_value.value = {
				code,
				hide: !display_goal,
				error: selected_chunk?.type === 'error' ? selected_chunk : undefined
			};
		}
	}, 500);

	$effect(() => {
		chunks;
		selected;
		view;
		proof_end_state;
		debounced_updateproofstate();
	});

	let proof_end_state: RocqEndProofState = $state('nothing');
	let _code_before = value_derived_trivial(() => getCodeBeforePosition(root, position));
	let code_before = $derived(_code_before.value);

	let debounced_updateproofendstate = debounced_task(async () => {
		const new_state = await lsp_getProofEndState(connection, code_before + '\n');
		proof_end_state = new_state;
	}, 1000);

	const worker = getContext<RocqWorker>(WORKER_CONTEXT);
	let connection = $derived(worker.connection!);
	$effect(() => {
		code_before;
		debounced_updateproofendstate();
	});
</script>

{#if proof_end_state == 'nothing'}
	<h4 class="flex w-full flex-row items-center gap-2 text-nowrap text-error-50-950">
		<FileWarning /> No rocq proof was found in rocq file
	</h4>
{/if}
<div class="ProseMirror py-5" use:editor></div>

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
