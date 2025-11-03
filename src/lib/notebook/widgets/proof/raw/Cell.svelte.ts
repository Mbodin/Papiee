import { KeybindingListener, type KeybindActions } from '$lib/keybind/keybind';
import type { Paragraph, ProofParagraph } from './Paragraph.svelte';

export type Cell = {
	type: 'cell';
	value?: string;
	parent: { index: number; parent: Paragraph };
};

export class ProofCell extends KeybindingListener<'cell'> implements Cell, KeybindActions<'cell'> {
	level: 'cell' = 'cell';
	type: Cell['type'] = 'cell';
	#parent: { index: number; parent: ProofParagraph };
	#value: Cell['value'];

	#predictions: string[] = $state([]);
	#selected_completion: number | -1 = $state(-1);

	position: { value: number } = { value: -1 };
	length: { readonly value: number } = { value: -1 };

	update() {
		this.parent.parent.update();
	}

	get predictions() {
		return this.#predictions;
	}

	get parent() {
		return this.#parent;
	}

	get index() {
		return this.#parent.index;
	}

	get value() {
		return this.#value!;
	}

	set value(v) {
		this.#value = v;
		this.update();
	}

	get selected_completion() {
		return this.#selected_completion;
	}

	set selected_completion(v) {
		this.#selected_completion = Math.min(Math.max(v, -1), this.predictions.length - 1);
	}

	constructor(value: string | undefined, parent: ProofParagraph, index: number) {
		super();
		this.#parent = $state({
			parent,
			index
		});
		this.#value = $state(value);

		this.#initialize();
	}

	selected_completion_up() {
		this.selected_completion--;
	}

	selected_completion_down() {
		this.selected_completion++;
	}

	selected_completion_complete() {
		if (this.selected_completion === -1) return;
		this.value = this.predictions[this.selected_completion];
		setTimeout(() => {
			this.move_after();
		});
	}

	#initialize() {
		if (this.#value == null) this.#value = '';
	}

	insert_new_line_after() {
		const pline = this.parent.parent;
		pline.insert_new_line_after();
	}

	insert_new_cell() {
		const paragraph = this.parent.parent;
		paragraph.insert_new_cell_after(this.parent.index);
	}

	focus_begin() {
		this.position.value = 0;
	}

	focus_end() {
		this.position.value = this.length.value;
	}

	move_after() {
		if (this.parent.index === this.parent.parent.value.length - 1)
			return this.parent.parent.move_after();
		this.parent.parent.value[this.parent.index + 1].focus_begin();
	}

	move_before() {
		if (this.parent.index === 0) return this.parent.parent.move_before();
		this.parent.parent.value[this.parent.index - 1].focus_end();
	}

	delete() {
		const cells = this.#parent.parent.cells;
		this.#parent.parent.cells = [
			...cells.slice(undefined, this.#parent.index),
			...cells.slice(this.#parent.index + 1)
		];
		this.move_before();
	}

	indent_increase() {
		const paragraph = this.parent.parent;
		paragraph.indent_increase();
	}

	indent_decrease() {
		const paragraph = this.parent.parent;
		paragraph.indent_decrease();
	}

	custom_filter() {
		return {
			start_input: this.position.value <= 0,
			end_input: this.position.value >= this.length.value,
			first_cell_of_paragraph: this.parent.index === 0 && this.parent.parent.parent?.index === 0,
			selected_completion: this.selected_completion !== -1
		};
	}
}
