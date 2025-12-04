import type { VersionedTextDocumentIdentifier, Position } from 'vscode-languageserver-types';

export type Pp =
	| ['Pp_empty']
	| ['Pp_string', string]
	| ['Pp_glue', Pp[]]
	| ['Pp_box', any, Pp]
	| ['Pp_tag', any, Pp]
	| ['Pp_print_break', number, number]
	| ['Pp_force_newline']
	| ['Pp_comment', string[]];

export function fromPpToString(value: Pp): string {
	value = trim_type(value);
	switch (value[0]) {
		case 'Pp_empty':
			return '';
		case 'Pp_string':
			return value[1];
		case 'Pp_glue':
			return value[1].map(fromPpToString).join('');
		case 'Pp_print_break':
			return ' '.repeat(value[1]) + '\n'.repeat(value[2]);
		case 'Pp_force_newline':
			return '\n';
		case 'Pp_comment':
			return '';
		case 'Pp_box':
			return fromPpToString(value[2]);
		case 'Pp_tag':
			return fromPpToString(value[2]);
	}
	return '';
}

function trim_type(value: Pp): Pp {
	switch (value[0]) {
		case 'Pp_empty':
			return value;
		case 'Pp_string':
			return value;
		case 'Pp_glue': {
			const new_value = ['Pp_glue', value[1].map(trim_type)] as ['Pp_glue', ...any] & Pp;

			const children = new_value[1];
			const n = children.length;
			const last = children[n - 1];

			if (
				last[0] === 'Pp_tag' &&
				last[1] === 'constr.variable' &&
				!children.slice(0, n - 1).find((v) => v[0] != 'Pp_string' && v[0] != 'Pp_print_break')
			) {
				const before_last = children[n - 2];

				if (before_last[0] === 'Pp_string') {
					return [
						'Pp_glue',
						children
							.slice(0, n - 2)
							.concat([['Pp_string', before_last[1].substring(0, before_last[1].lastIndexOf(':'))]])
					];
				}
			}

			return new_value;
		}
		case 'Pp_print_break':
			return value;
		case 'Pp_force_newline':
			return value;
		case 'Pp_comment':
			return value;
		case 'Pp_box':
			return ['Pp_box', value[1], trim_type(value[2])];
		case 'Pp_tag':
			return ['Pp_tag', value[1], trim_type(value[2])];
	}
	// throw new Error('Unknown pp case' + String(value));
	console.error(value);
}

export interface Hyp<Pp> {
	names: string[];
	def?: Pp;
	ty: Pp;
}

export interface Goal<Pp> {
	hyps: Hyp<Pp>[];
	ty: Pp;
}

export interface GoalConfig<G, Pp> {
	goals: Goal<G>[];
	stack: [Goal<G>[], Goal<G>[]][];
	bullet?: Pp;
	shelf: Goal<G>[];
	given_up: Goal<G>[];
}

export interface Message<Pp> {
	range?: Range;
	level: number;
	text: Pp;
}

export interface GoalAnswer<G, Pp> {
	textDocument: VersionedTextDocumentIdentifier;
	position: Position;
	range?: Range;
	goals?: GoalConfig<G, Pp>;
	messages: Pp[] | Message<Pp>[];
	error?: Pp;
	program?: any;
}

export const EMPTY_GOAL: GoalAnswer<any, any> = {
	textDocument: {
		uri: 'NOTHING',
		version: 1
	},
	messages: [],
	position: {
		character: 0,
		line: 0
	}
};
