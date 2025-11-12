import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-jsonrpc/browser';
import * as proto from 'vscode-languageserver-protocol';
import * as types from 'vscode-languageserver-types';

import * as raw from '$lib/../../rocq/rocq.json';

const rocqDumpFile = raw satisfies RocqDumpFile;

type RocqDumpFile = {
	files: { [filename in string]: string };
};

export async function create(wpath: string): Promise<proto.MessageConnection> {
	let wuri = wpath + '/wasm-bin/wacoq_worker.js';

	let worker = new Worker(wuri);
	worker.postMessage(wpath);

	let reader = new BrowserMessageReader(worker);
	let writer = new BrowserMessageWriter(worker);
	let conn = proto.createMessageConnection(reader, writer);

	conn.listen();
	return conn;
}

export async function initialize(
	connection: proto.MessageConnection,
	params: Partial<proto.InitializeParams> = {}
) {
	let initializeParameters: proto.InitializeParams = {
		...params,
		processId: null,
		rootUri: 'exercise',
		workspaceFolders: null,
		initializationOptions: { eager_diagnostics: false, messages_follow_goal: true },
		capabilities: {
			textDocument: {
				publishDiagnostics: {
					relatedInformation: true
				}
			}
		}
	};

	await connection.sendRequest(proto.InitializeRequest.type, initializeParameters);

	await Promise.all(
		Object.keys(rocqDumpFile.files).map(async ([path, value]) => {
			let uri = 'file:///exercise/' + path;
			let languageId = 'rocq';
			let version = 1;
			let text = value;
			let textDocument = types.TextDocumentItem.create(uri, languageId, version, text);
			let openParams: proto.DidOpenTextDocumentParams = { textDocument };
			await connection
				.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams)
				.then(console.log)
				.catch(console.error);

			await connection
				.sendNotification('coq/saveVo', openParams)
				.then(console.log)
				.catch(console.error);
		})
	);

	await connection.sendNotification('coq/workspace_update').then(console.log).catch(console.error);
	await connection.sendNotification('').then(console.log).catch(console.error);
	{
		const path = 'main.v';
		const value = 'Require Import Test.\nPrint Lemma.';
		let uri = 'file:///exercise/' + path;
		let languageId = 'rocq';
		let version = 1;
		let text = value;
		let textDocument = types.TextDocumentItem.create(uri, languageId, version, text);
		let openParams: proto.DidOpenTextDocumentParams = { textDocument };
		await connection
			.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams)
			.then(console.log)
			.catch(console.error);

		await connection
			.sendRequest('proof/goals', {
				textDocument: { uri, version } satisfies proto.VersionedTextDocumentIdentifier,
				position: { line: 0, character: 10 } satisfies proto.Position,
				pp_format: 'String',
				mode: 'After'
			})
			.then(console.log)
			.catch(console.error);
	}

	return connection;
}

export async function close(connection: proto.MessageConnection) {
	await connection.sendNotification(proto.ExitNotification.type);
	return connection;
}

export const WORKER_CONTEXT = 'worker-connection';
export type RocqWorker = {
	connection: proto.MessageConnection | undefined;
};
