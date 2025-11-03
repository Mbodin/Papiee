import { ProofParagraph, type Paragraph } from './Paragraph.svelte';

export type Document = {
	type: 'document';
	name: string;
	value: Paragraph[];
};

export class ProofDocument implements Document {
	type: 'document' = 'document';
	#value: ProofParagraph[];
	rocq?: { value: string; range: Range };
	readonly name: string;

	update() {}

	get value() {
		return this.#value;
	}

	set value(v) {
		this.#value = v.map((v, i) => {
			v.parent.index = i;
			return v;
		});
	}

	constructor(name: string, value: ProofParagraph[]) {
		this.name = name;
		this.#value = $state(value);
		this.#initialize();
	}

	focus_begin() {
		if (this.value.length === 0) return false;
		return this.value[0].focus_begin();
	}

	focus_end() {
		if (this.value.length === 0) return false;
		return this.value[this.value.length - 1].focus_end();
	}

	move_after(): false {
		return false;
	}

	move_before(): false {
		return false;
	}

	#initialize() {
		if (this.#value.length === 0) this.#value = [new ProofParagraph([], 0, this, 0)];
	}
}
