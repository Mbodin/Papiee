import * as proto from 'vscode-languageserver-protocol';
import * as types from 'vscode-languageserver-types';
import type { MessageConnection } from './type';

export async function transient_file_consume<T>(
	connection: MessageConnection,
	consumer: (value: { uri: string; document: types.TextDocumentItem }) => T,
	content?: string
): Promise<T> {
	const uri = 'file:///exercise/_' + crypto.randomUUID().replaceAll('-', '_') + '.v';
	let value = undefined as ReturnType<typeof consumer> | undefined;
	try {
		let document = types.TextDocumentItem.create(uri, 'rocq', 1, content || '');
		if (content) {
			let openParams: proto.DidOpenTextDocumentParams = { textDocument: document };
			console.log(document);
			await connection
				.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams)
				.catch(console.error);
		}
		value = await consumer({ uri, document });
	} catch (e) {
		console.error(e);
	} finally {
		await connection
			.sendNotification(proto.DidCloseTextDocumentNotification.type, {
				textDocument: proto.TextDocumentIdentifier.create(uri)
			})
			.catch(console.error);
		return value!;
	}
}
