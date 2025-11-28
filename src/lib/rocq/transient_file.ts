import * as proto from 'vscode-languageserver-protocol';
import * as types from 'vscode-languageserver-types';
import type { MessageConnection } from './type';
import { Cache } from '$lib/cache';

let toremove: string[] = [];
const transient_file_cache = new Cache<string, types.TextDocumentItem>(32, (k) => toremove.push(k));

export function findExistingTransientFile(content: string): types.TextDocumentItem | undefined {
	const key = transient_file_cache.keys().find((v) => {
		const raw = transient_file_cache.get(v)!.value;
		return raw.text.startsWith(content);
	});
	if (key) {
		return transient_file_cache.get(key)!.value;
	}
	return undefined;
}

export async function transient_file_consume<T>(
	connection: MessageConnection,
	consumer: (value: { uri: string; document: types.TextDocumentItem }) => T,
	content?: string
): Promise<T> {
	const existing = content ? findExistingTransientFile(content) : undefined;

	[...toremove].forEach((uri) => {
		connection
			.sendNotification(proto.DidCloseTextDocumentNotification.type, {
				textDocument: proto.TextDocumentIdentifier.create(uri)
			})
			.catch(console.error)
			.then(() => {
				toremove = toremove.filter((v) => uri !== v);
			});
	});

	let document =
		existing ||
		types.TextDocumentItem.create(
			'file:///exercise/_' + crypto.randomUUID().replaceAll('-', '_') + '.v',
			'rocq',
			1,
			content || ''
		);
	if (content && !existing) {
		let openParams: proto.DidOpenTextDocumentParams = { textDocument: document };
		await connection
			.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams)
			.catch(console.error);
		transient_file_cache.set(document.uri, document);
	}
	return consumer({ uri: document.uri, document });
}
