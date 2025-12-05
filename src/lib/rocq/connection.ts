import { BrowserMessageReader, BrowserMessageWriter } from 'vscode-jsonrpc/browser';
import * as proto from 'vscode-languageserver-protocol';
import * as types from 'vscode-languageserver-types';

import * as raw from '$lib/../../rocq/rocq.json';
import type { MessageConnection } from './type';
import { transient_file_consume } from './transient_file';

const rocqDumpFile = raw as RocqDumpFile;

type RocqDumpFile = {
	files: { [filename in string]: string };
};

export function getRocqFileHeaderContent(): string {
	return (
		Object.keys(rocqDumpFile.files)
			.map((v) => v.replace('.v', ''))
			.map((v) => `Require Import ${v}.`) // It would be better to just import the file but it works to just paste the code before
			.join('\n') + '\n'
	);
}

export async function create(origin: string): Promise<MessageConnection> {
	let wuri = '/wasm-bin/wacoq_worker.js';

	let worker = new Worker(wuri);
	worker.postMessage(origin);

	let reader = new BrowserMessageReader(worker);
	let writer = new BrowserMessageWriter(worker);
	let connection = proto.createMessageConnection(reader, writer);

	connection.listen();

	(connection as MessageConnection).transient_file = ((consumer, content) => {
		return transient_file_consume(connection as MessageConnection, consumer, content);
	}) as MessageConnection['transient_file'];

	return connection as MessageConnection;
}

export async function initialize(
	connection: MessageConnection,
	params: Partial<proto.InitializeParams> = {}
): Promise<MessageConnection> {
	let initializeParameters: proto.InitializeParams = {
		...params,
		processId: null,
		rootUri: 'file:///exercise',
		initializationOptions: { eager_diagnostics: true, messages_follow_goal: true },
		trace: 'verbose',
		capabilities: {
			textDocument: {
				publishDiagnostics: {
					relatedInformation: true
				}
			}
		}
	};

	// connection.onNotification(proto.LogTraceNotification.type, (e) => console.log(e.message));

	await connection.sendNotification(proto.SetTraceNotification.type, { value: 'verbose' });
	await connection.sendRequest(proto.InitializeRequest.type, initializeParameters);
	await connection.sendNotification(proto.InitializedNotification.type, {});
	await Promise.all(
		Object.keys(rocqDumpFile.files).map(async (path) => {
			const uri = 'file:///exercise/' + path;
			const languageId = 'rocq';
			const version = 1;
			const text = rocqDumpFile.files[path];
			const textDocument = types.TextDocumentItem.create(uri, languageId, version, text);
			const openParams: proto.DidOpenTextDocumentParams = { textDocument };

			await connection.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams);
		})
	);

	await connection.sendNotification('coq/workspace_update', {
		added: Object.keys(rocqDumpFile.files).map((path) => ({
			uri: `file:///exercise/${path}`
		})),
		removed: []
	});

	await Promise.all(
		Object.keys(rocqDumpFile.files).map(async (path) => {
			const uri = `file:///exercise/${path}`;
			const textDocument = types.TextDocumentItem.create(uri, 'rocq', 1, rocqDumpFile.files[path]);
			const openParams: proto.DidOpenTextDocumentParams = { textDocument };

			await connection.sendRequest('coq/saveVo', openParams);
		})
	);

	return connection as MessageConnection;
}

export async function close(connection: MessageConnection) {
	await connection.sendNotification(proto.ExitNotification.type);
	return connection;
}

export const WORKER_CONTEXT = 'worker-connection';
export type RocqWorker = {
	connection: MessageConnection | undefined;
};
