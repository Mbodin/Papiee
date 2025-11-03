import type { Document, ProofDocument } from './Document.svelte';
import { ProofCell, type Cell } from './Cell.svelte';

export type Paragraph = {
	type: 'paragraph';
	indent: number;
	value: Cell[];
	parent: {
		parent: Document;
		index: number;
	};
};

function is_cell_empty(v: ProofCell | undefined): boolean {
	return !v || v.value.trim().length === 0;
}

function collapse_empty(cells: ProofCell[]): ProofCell[] {
	return cells.reduce((a: ProofCell[], b: ProofCell) => {
		if (a.length === 0) return [b];
		let last = a[a.length - 1];
		if (is_cell_empty(last) && is_cell_empty(b)) {
			const { value: position } = b.position;
			if (position !== -1) last.position.value = position;
			return a;
		}
		return a.concat(b);
	}, []);
}

export class ProofParagraph implements Paragraph {
	type: 'paragraph' = 'paragraph';
	#value: ProofCell[];
	#indent: number;
	collasped = $state(false);
	parent: { parent: ProofDocument; index: number };

	update() {
		let n = this.#value.length;
		if (!is_cell_empty(this.#value[n - 1])) {
			this.new_cell_at_index(n);
			return; // Returning because cells was updated so a new update was started
		}
		const collapsed = collapse_empty(this.#value);
		if (collapsed.length !== this.#value.length) {
			this.#value = collapsed;
			return; // Returning because cells was updated so a new update was started
		}
		this.parent.parent.update();
	}
	new_cell_at_index(cell_index: number): ProofCell {
		const cell = new ProofCell('', this, cell_index);
		this.#value = [
			...this.#value.slice(undefined, cell_index),
			cell,
			...this.#value.slice(cell_index, undefined)
		];
		cell.update();
		return cell;
	}

	get cells() {
		return this.#value;
	}

	set cells(v) {
		if (v.length !== 0) this.#value = v;
		this.update();
	}

	get value() {
		return this.#value;
	}

	get indent() {
		return this.#indent;
	}

	set indent(v) {
		this.#indent = Math.min(Math.max(v, 0), 10);
	}

	constructor(cells: ProofCell[], indent: number, parent: ProofDocument, index: number) {
		this.#value = $state(cells);
		this.#indent = $state(indent);
		this.parent = { parent, index };
		this.#initialize();
	}

	#initialize() {
		if (this.#value.length === 0) this.new_cell_at_index(0);
	}

	insert_new_line_after() {
		const document = this.parent.parent;

		const new_paragraph = new ProofParagraph([], this.indent, document, this.parent.index + 1);

		document.value = [
			...document.value.slice(0, this.parent.index + 1),
			new_paragraph,
			...document.value.slice(this.parent.index + 1)
		];

		new_paragraph.value[0].focus_begin();
	}

	move_after() {
		if (this.parent.index === this.parent.parent.value.length - 1)
			return this.parent.parent.move_after();
		this.parent.parent.value[this.parent.index + 1].focus_begin();
	}

	focus_begin() {
		if (this.value.length === 0) return this.parent.parent.move_before();
		this.value[0].focus_begin();
	}

	focus_end() {
		if (this.value.length === 0) return false;
		this.value[this.value.length - 1].focus_end();
	}

	move_before() {
		if (this.parent.index === 0) return false;
		this.parent.parent.value[this.parent.index - 1].focus_end();
	}

	indent_increase() {
		const parent = this._paragraph_parent();
		if ((!parent && this.parent.index === 0) || parent?.index === 0) return; // Cannot move indent of the root paragraph

		const focused = this.#value.findIndex((v) => v.position.value !== -1);
		const focused_position = focused != -1 ? this.#value[focused].position.value : -1;

		this.indent += 1;

		if (focused != -1 && focused_position != -1) {
			// Little bit ugly but it works fine
			setTimeout(() => {
				return (this.#value[focused].position.value = focused_position);
			});
		}
	}

	indent_decrease() {
		const focused = this.#value.findIndex((v) => v.position.value !== -1);
		const focused_position = focused != -1 ? this.#value[focused].position.value : -1;

		this.indent -= 1;

		if (focused != -1 && focused_position != -1) {
			// Little bit ugly but it works fine
			setTimeout(() => {
				return (this.#value[focused].position.value = focused_position);
			});
		}
	}

	insert_new_cell_after(index: number) {
		if (!this.value) return;
		const cell = this.new_cell_at_index(index + 1);

		if (!cell) return this.move_after();
		else cell.position.value = 0;
	}

	_paragraph_parent() {
		const indent = this.indent;
		const { parent: document, index } = this.parent;

		const parent = document.value.slice(undefined, index).findLast((v) => v.indent < indent);

		if (!parent) return undefined;
		return {
			parent,
			index: parent._paragraph_children().findIndex((v) => v.parent.index === index)!
		};
	}

	_paragraph_children(deep = false) {
		const indent = this.indent;
		const { parent: document, index } = this.parent;

		let next_sibiling_i =
			document.value.slice(index + 1).findIndex((o) => o.indent <= indent) + index + 1;
		if (next_sibiling_i <= index)
			// means that next_child_i = -1 + index
			next_sibiling_i = document.value.length;

		const deep_children = document.value.slice(index + 1, next_sibiling_i);

		let min_indent = $derived(Math.min(...(deep_children.map((v) => v.indent) || [0])));

		return deep ? deep_children : deep_children.filter((v) => v.indent === min_indent);
	}

	_paragraph_previoussibiling() {
		const parent = this._paragraph_parent();
		if (!parent || parent.index === 0) return undefined;
		return parent.parent?._paragraph_children()[parent.index - 1];
	}

	_paragraph_nextsibling() {
		const parent = this._paragraph_parent();
		if (!parent || parent.index === 0) return undefined;
		return parent.parent?._paragraph_children()[parent.index + 1];
	}
}
