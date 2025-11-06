export interface ILexer<T> {
	/** Reset the internal buffer and optionally restore state info returned from save(). */
	reset(chunk?: string | InputToken[], info?: T): this;
	/** Feed more input into the lexer buffer (useful for streaming). */
	feed(chunk: string | InputToken[]): void;
	/** Return the next token or undefined at EOF. */
	next(): InputToken | undefined;
	/** Save the current internal lexer state. The shape of the returned object is implementation-defined. */
	save(): T;
	/** Check wether the tokenizer records a token with a given name */
	has(name: string): boolean;
	/** Restore a previously-saved state (the argument is the object returned from save()). */
	restore(info: T): void;
	/** Make a shallow copy of the lexer (useful if you need independent cursors). */
	clone(): ILexer<T>;
	/** Format a helpful error message for a given token / position. */
	formatError(token: InputToken | undefined, message?: string): string;
	/** Make the lexer iterable (for-of yields Token objects until EOF). */
	[Symbol.iterator](): IterableIterator<InputToken>;
	/** Current lexer state name when using states, if applicable. Not always present. */
	state?: string;
}

type InputToken = string | { type: 'stop_everything' } | any;

export function stringOrTokenToInputToken(chunk: string | InputToken[]): InputToken[] {
	return typeof chunk === 'string' ? [...chunk].map((v) => v) : chunk;
}

export class Lexer implements ILexer<{ index: number }> {
	buffer: InputToken[] = [];
	index = 0;

	reset(chunk?: string | InputToken[], info?: { index: number }): this {
		this.buffer = stringOrTokenToInputToken(chunk || []);
		this.index = 0;
		return this;
	}

	feed(chunk: string | InputToken[]): void {
		this.buffer = [...this.buffer, ...stringOrTokenToInputToken(chunk)];
	}

	has(_name: string): boolean {
		return true;
	}

	next(): InputToken | undefined {
		const input_token = this.buffer[this.index++];

		if (!input_token) return undefined;
		if (typeof input_token === 'string') return { value: input_token };
		return input_token;
	}

	save() {
		return { index: this.index };
	}

	restore(info: { index: number }): void {
		this.index = info.index;
	}

	clone() {
		const lexer = new Lexer();
		lexer.buffer = [...this.buffer];
		lexer.index = this.index;
		return lexer;
	}

	formatError(token: InputToken | undefined, message?: string): string {
		return '';
	}

	*[Symbol.iterator]() {
		while (this.index < this.buffer.length) yield this.next()!;
	}
}
