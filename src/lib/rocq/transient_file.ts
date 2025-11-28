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
	preset: Partial<proto.TextDocumentItem> = {}
): Promise<T> {
	const existing_document = preset.text ? findExistingTransientFile(preset.text) : undefined;
	const document: types.TextDocumentItem = {
		languageId: 'rocq',
		uri:
			preset.uri ||
			existing_document?.uri ||
			'file:///exercise/_' + crypto.randomUUID().replaceAll('-', '_') + '.v',
		version: preset.version || existing_document?.version || 1,
		text: preset.text || ''
	};

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

	if (
		preset.text &&
		(!existing_document || preset.uri) &&
		(!existing_document || existing_document.text !== preset.text)
	) {
		let openParams: proto.DidOpenTextDocumentParams = {
			textDocument: document
		};
		await connection
			.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams)
			.catch(console.error);
		if (!preset.uri) transient_file_cache.set(document.uri, document);
	}
	return consumer({ uri: document.uri, document });
}
