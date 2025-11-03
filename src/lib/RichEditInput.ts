import { Selection, Transaction, type EditorState } from 'prosemirror-state';
import type { PositionHelper } from './notebook/widgets/types';
import type { EditorView } from 'prosemirror-view';
import * as mathlive from 'mathlive';

export type RichInputPosition = {
	segment: number;
	offset: number;
};

export function isValidPosition(pos?: RichInputPosition) {
	return pos && pos.segment >= 0 && pos.offset >= 0;
}

export function comparePosition(pos1?: RichInputPosition, pos2?: RichInputPosition) {
	if (!isValidPosition(pos1)) return -1;
	if (!isValidPosition(pos2)) return 1;

	const segment_diff = pos1!.segment - pos2!.segment;
	const offset_diff = pos1!.offset - pos2!.offset;

	return segment_diff === 0 ? offset_diff : segment_diff;
}

export const RichEditInputPositionHelper: PositionHelper<EditorView, RichInputPosition> = {
	get(view) {
		const { $head: head, $from: from, $to: to } = view.state.selection;

		const before = head.nodeBefore;
		const after = head.nodeAfter;
		if (!before) return { segment: 0, offset: 0 };

		// Check if inside math node
		if (before.type.name === 'math' && from.pos === to.pos - 1) {
			// If there is one child then it means it's the math node but prosemirror enable addition of text before so it's visually the 2nd node
			const segment = view.state.doc.content.childCount === 1 ? 1 : head.index(0) - 1;

			const nodeView = view!.nodeDOM(from.pos)?.childNodes[0] as mathlive.MathfieldElement;
			if (!nodeView.hasFocus()) return undefined;
			const offset = nodeView.position;

			return { segment, offset };
		}

		if (!view.hasFocus() && head.pos !== head.start() && head.pos !== head.end()) {
			return undefined;
		}

		// TODO error when input starts with math because of the "shadow" text input before
		const segment =
			view.state.doc.content.childCount === 1
				? 0
				: head.index(0) - (after != null && after.type.name === 'math' ? 1 : 0);

		const before_offset = head.parent.children.map((v, i) => (i >= segment ? 0 : v.nodeSize));

		const offset = head.pos - before_offset.reduce((a, b) => a + b, 0);

		return { segment, offset };
	},

	isFirst(value) {
		return comparePosition(this.get(value), this.getBegin(value)) === 0;
	},

	isLast(value) {
		return comparePosition(this.get(value), this.getEnd(value)) === 0;
	},

	getBegin(_value) {
		return { segment: 0, offset: 0 };
	},

	getEnd(value) {
		const content = value.state.doc.content;

		// If text is automatically added by prose mirror view but not in the content
		const shadow_text_prefix = content.firstChild?.type.name === 'text' ? 0 : 1;
		const shadow_text_suffix = content.lastChild?.type.name === 'text' ? 0 : 1;

		const segment = content.childCount + shadow_text_prefix + shadow_text_suffix - 1;
		const node = shadow_text_suffix === 1 ? undefined : content.lastChild!;
		if (!node) return { segment, offset: 0 };

		let offset = 0;

		const before = content.content
			.map((v, i) => (i >= segment ? 0 : v.nodeSize))
			.reduce((a, b) => a + b, 0);

		if (node.type.name === 'math') {
			const nodeView = value!.nodeDOM(before)?.childNodes[0] as mathlive.MathfieldElement;
			offset = nodeView?.lastOffset || 0;
		} else {
			offset = node.nodeSize;
		}

		return { segment, offset };
	},

	moveLeft(value) {
		throw new Error('Should not be used externally, RichEditInput should manage moveLeft');
	},

	moveRight(value) {
		throw new Error('Should not be used externally, RichEditInput should manage moveRight');
	},

	moveTo(value, position) {
		const content = value.state.doc.content;
		let focus = true;

		// If text is automatically added by prose mirror view but not in the content
		const shadow_text_prefix = content.firstChild?.type.name === 'text' ? 0 : 1;

		let tr: Transaction | undefined = value.state.tr;
		if (position == undefined) {
			value.dom.blur();
			return value;
		}
		if (!isValidPosition(position)) tr = tr.setSelection(Selection.atStart(value.state.doc));
		else if (comparePosition(position, { segment: 0, offset: 0 }) === 0)
			tr = value.state.tr.setSelection(Selection.atStart(value.state.doc));
		else {
			const segment = position!.segment - shadow_text_prefix;
			if (segment >= content.childCount) {
				tr = tr.setSelection(Selection.atEnd(tr.doc));
			} else {
				const node = content.child(segment);

				const before = content.content
					.map((v, i) => (i >= segment ? 0 : v.nodeSize))
					.reduce((a, b) => a + b, 0);

				if (node.type.name === 'math') {
					const nodeView = value!.nodeDOM(before)?.childNodes[0] as mathlive.MathfieldElement;
					nodeView.focus();
					setTimeout(() => (nodeView.position = position!.offset));
					focus = false;
					tr = undefined;
				} else {
					const offset = before + position!.offset;
					if (offset >= tr.doc.nodeSize) tr = tr.setSelection(Selection.atEnd(tr.doc));
					else if (offset < 0) tr = tr.setSelection(Selection.atStart(tr.doc));
					else tr = tr.setSelection(Selection.near(tr.doc.resolve(offset)));
				}
			}
		}

		if (focus && !value.hasFocus()) {
			value.focus();
			if (tr) value.dispatch(tr);
		} else {
			if (tr) value.dispatch(tr);
		}

		return value;
	}
};
