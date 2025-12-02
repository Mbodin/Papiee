import type { Node as P_Node } from 'prosemirror-model';
import * as mathlive from 'mathlive';
import type { Decoration, DecorationSource, EditorView, NodeView } from 'prosemirror-view';
import { Plugin, Selection, TextSelection } from 'prosemirror-state';
import 'mathlive/fonts.css';
import './math.css';
import { keymap } from 'prosemirror-keymap';
import { schema } from '$lib/notebook/nodes/proof/schema';
import { Plug } from '@lucide/svelte';

export const plugins: Plugin[] = [
	new Plugin({
		view(view) {
			return {
				update(view, prevState) {
					const head = view.state.selection.$head;
					if (head.node().type.name !== schema.nodes.math.name) return;
					const math_node = view?.nodeDOM(head.$start().pos - 1);
					const mathfield_e = math_node?.firstChild! as mathlive.MathfieldElement;
					setMathLiveFromProsemirror(view!, mathfield_e);
				}
			};
		}
	}),

	keymap({
		ArrowLeft: (state, dispatch, view) => {
			const head = state.selection.$head;

			try {
				const guessed = head.$decrement();
				if (guessed.node().type.name !== schema.nodes.math.name) return false;
				let tr = state.tr;
				tr = tr.setSelection(Selection.near(guessed));
				if (dispatch) {
					dispatch(tr);
					return true;
				}
			} catch (_e) {
				return false;
			}

			return false;
		},
		ArrowRight: (state, dispatch, view) => {
			const head = state.selection.$head;

			try {
				const guessed = head.$increment();
				if (guessed.node().type.name !== schema.nodes.math.name) return false;
				let tr = state.tr;
				tr = tr.setSelection(Selection.near(guessed));
				if (dispatch) {
					dispatch(tr);
					return true;
				}
			} catch (_e) {
				return false;
			}

			return false;
		},
		$: (state, dispatch, view) => {
			const head = state.selection.$head;

			const inserted = schema.nodes.math.create(undefined, [schema.text(' ')]);
			let tr = state.tr;
			tr = tr.insert(head.pos, inserted);
			tr = tr.setSelection(Selection.near(tr.doc.resolve(head.pos + 1)));

			dispatch?.(tr);

			return true;
		}
	})
];

function setMathLiveFromProsemirror(view: EditorView, mathfield: mathlive.MathfieldElement) {
	const $head = view.state.selection.$head;
	const textOffset = $head.parentOffset;

	const maxOffset = mathfield.lastOffset;
	const offsetToPosition = Array.from({ length: maxOffset + 1 }).map(
		(_v, i) => mathfield.getValue(0, i).length
	);

	const position = offsetToPosition.findIndex((v) => v >= textOffset);

	if (!mathfield.hasFocus()) mathfield.focus();
	if (position !== mathfield.position) mathfield.position = position;
}

export class MathLiveNodeView implements NodeView {
	node: P_Node;
	dom: HTMLElement;
	mathfield: mathlive.MathfieldElement;
	contentDOM?: HTMLElement | null | undefined;
	view: EditorView;
	getPos: () => number | undefined;
	decorations: readonly Decoration[];
	innerDecoration: DecorationSource;
	multiType = false;

	constructor(
		node: P_Node,
		view: EditorView,
		getPos: () => number | undefined,
		decorations: readonly Decoration[],
		innerDecoration: DecorationSource
	) {
		this.node = node;
		this.view = view;
		this.decorations = decorations;
		this.getPos = getPos;
		this.innerDecoration = innerDecoration;
		this.dom = document.createElement('span');
		this.dom.className = 'math-node';

		mathlive.MathfieldElement.soundsDirectory = null;
		this.mathfield = new mathlive.MathfieldElement();
		this.mathfield.smartFence = true;
		this.mathfield.smartMode = false;
		this.mathfield.smartSuperscript = false;
		this.updateMathfieldFromNode();

		// Allow the mathfield to be editable
		this.dom.appendChild(this.mathfield);

		// --- Sync changes to ProseMirror ---
		this.mathfield.addEventListener('input', (e) => {
			const value = this.mathfield.value;
			const pos = this.getPos()!;
			if (value.includes('\\$')) {
				const tr = this.view.state.tr.setSelection(
					Selection.near(this.view.state.doc.resolve(pos + this.node.nodeSize))
				);
				this.mathfield.value = value.replace('\\$', '');
				this.view.dispatch(tr);
				return;
			}
			let tr = view.state.tr;
			const selection = tr.selection.$head;
			tr = tr.replaceWith(
				pos + 1,
				pos + this.node.nodeSize - 1,
				value.length === 0 ? [schema.text(' ')] : [schema.text(value)]
			);
			tr = tr.setSelection(Selection.near(tr.doc.resolve(selection.pos)));
			this.view.dispatch(tr);
		});

		this.mathfield.addEventListener('keydown', (e: KeyboardEvent) => {
			// Detect "$" key
			if (e.key === '$') {
				const pos = this.getPos?.();
				if (pos == null) return;

				// Prevent MathLive from inserting another "$"
				e.preventDefault();
				e.stopPropagation();

				// Move cursor after the math node
				const { state, dispatch } = this.view;
				const tr = state.tr.setSelection(
					// Move selection just *after* the math node
					// pos + this.node.nodeSize accounts for the outer node boundaries
					Selection.near(state.doc.resolve(pos + this.node.nodeSize))
				);
				dispatch(tr);

				// Focus ProseMirror editor again
				this.view.focus();
			}
		});

		// --- Prevent PM from stealing focus ---
		this.dom.addEventListener('mousedown', (e) => {
			e.stopPropagation();
			this.mathfield.focus();
		});

		const save = this;

		this.mathfield.addEventListener('focus', (e) => {
			e.stopPropagation();
			save.setProsemirrorFromMathLive();
		});

		this.mathfield.addEventListener('selection-change', (e) => {
			e.stopPropagation();
			save.setProsemirrorFromMathLive();
		});

		// Handle arrow keys at edges

		this.mathfield.addEventListener('move-out', (e: any) => {
			const pos = this.getPos();
			if (pos === undefined) return;

			const nodeSize = this.node.nodeSize;

			let $pos;
			let $bias;
			if (e.detail.direction === 'forward') {
				$pos = this.view.state.doc.resolve(pos + nodeSize);
				$bias = 1;
			} else if (e.detail.direction === 'backward') {
				$pos = this.view.state.doc.resolve(pos);
				$bias = -1;
			} else {
				return;
			}

			const selection = Selection.near($pos, $bias);
			const tr = this.view.state.tr.setSelection(selection);

			this.view.dispatch(tr);
			this.view.focus();
		});
	}

	setProsemirrorFromMathLive() {
		// When MathLive focuses, select the node in PM if needed
		const doc = this.view.state.doc;

		// Position at the beginning of the node
		let $pos = doc.resolve(this.getPos()!).$increment();
		try {
			$pos = $pos.$increment(this.mathfield.getValue(0, this.mathfield.position).length);
		} catch (e) {
			console.error(e);
			$pos = doc.resolve(this.getPos()!).$end();
		}

		this.view.dispatch(this.view.state.tr.setSelection(Selection.near($pos)));
	}

	updateMathfieldFromNode() {
		this.mathfield.value = this.node.textContent || '';
	}

	// --- Prevent PM from handling *any* events inside the mathfield ---
	stopEvent(event: any) {
		const target = event.target;
		if (!target) return false;

		// Stop ProseMirror from handling *everything* inside the mathfield
		if (this.mathfield.contains(target)) return true;

		// Also block keyboard events specifically
		if (/^(keydown|keypress|keyup|input)$/.test(event.type)) return true;

		return false;
	}

	// --- PM should ignore DOM mutations made by MathLive ---
	ignoreMutation() {
		return true;
	}

	selectNode() {
		this.dom.classList.add('ProseMirror-selectednode');
	}

	deselectNode() {
		this.dom.classList.remove('ProseMirror-selectednode');
	}

	update(node: P_Node, decorations: readonly Decoration[], innerDecorations: DecorationSource) {
		if (node.type !== this.node.type) return false;
		this.node = node;
		this.updateMathfieldFromNode();

		// Check if node is part of current selection
		const { from, to } = this.view.state.selection;
		const pos = this.getPos?.();
		if (pos != null) {
			const nodeStart = pos;
			const nodeEnd = pos + node.nodeSize;
			const selected = from < nodeEnd && to > nodeStart;

			this.dom.classList.toggle('math-selected', selected);
		}

		return true;
	}
}
