import * as proto from 'vscode-languageserver-protocol';
import * as types from 'vscode-languageserver-types';

export type MessageConnection = proto.MessageConnection & {
	transient_file<T>(
		consumer: (value: { uri: string; document: types.TextDocumentItem }) => T,
		preset?: Partial<proto.TextDocumentItem>
	): Promise<T>;
};

export type LspVariable = {
	set: string;
	identifier: string;
};

export type LspProofState = {
	variables: LspVariable[];
	goal: string;
};
