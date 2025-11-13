<script lang="ts">
	import type { ProofChunk } from '$lib/notebook/widgets/proof/chunk';
	import { WORKER_CONTEXT, type RocqWorker } from '$lib/rocq/connection';
	import { getContext } from 'svelte';
	import type { Position } from 'vscode-languageserver-types';
	import * as proto from 'vscode-languageserver-protocol';
	import * as types from 'vscode-languageserver-types';
	import type { GoalAnswer } from '$lib/rocq/type';

	let { chunks, position }: { chunks: ProofChunk[]; position: number } = $props();

	const code = $derived(
		chunks
			.filter((v) => v.type === 'tactic')
			.map((v) => v.code)
			.join('')
	);

	const rocq_position: Position = $derived.by(() => {
		const before = chunks
			.slice(0, position + 1)
			.filter((v) => v.type === 'tactic')
			.map((v) => v.code)
			.join('');

		const line_number = before.includes('\n') ? before.split('\n').length - 1 : 0;
		const last_line = before.includes('\n') ? before.substring(before.lastIndexOf('\n')) : before;
		return {
			line: line_number,
			character: last_line.length
		};
	});

	const { connection } = getContext<RocqWorker>(WORKER_CONTEXT);

	let state: GoalAnswer<string, string> | undefined = $state();
	$effect(() => {
		if (!connection) {
			return undefined;
		}
		chunks;
		rocq_position;
		let uri = 'file:///exercise/main.v';
		let languageId = 'rocq';
		let version = 1;
		let text = code;
		let textDocument = types.TextDocumentItem.create(uri, languageId, version, text);
		let openParams: proto.DidOpenTextDocumentParams = { textDocument };
		connection.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams).then(() =>
			connection
				.sendRequest('proof/goals', {
					textDocument: { uri, version } satisfies proto.VersionedTextDocumentIdentifier,
					position: rocq_position satisfies Position,
					pp_format: 'String',
					mode: 'After'
				})
				.then((v) => (state = v as GoalAnswer<string, string>))
		);
	});
</script>
