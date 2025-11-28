import type { Position, VersionedTextDocumentIdentifier } from 'vscode-languageserver-types';
import * as proto from 'vscode-languageserver-protocol';
import * as types from 'vscode-languageserver-types';

export type MessageConnection = proto.MessageConnection & {
	transient_file<T>(
		consumer: (value: { uri: string; document: types.TextDocumentItem }) => T,
		preset?: Partial<proto.TextDocumentItem>
	): Promise<T>;
};

export interface Hyp<Pp> {
	names: Pp[];
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
