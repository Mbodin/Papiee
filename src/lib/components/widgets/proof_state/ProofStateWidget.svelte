<script lang="ts">
	import { cnltoRocq, type ProofChunk } from '$lib/notebook/nodes/proof/chunk';
	import { WORKER_CONTEXT, type RocqWorker } from '$lib/rocq/connection';
	import { getContext } from 'svelte';
	import type { Position } from 'vscode-languageserver-types';
	import * as proto from 'vscode-languageserver-protocol';
	import * as types from 'vscode-languageserver-types';
	import type { GoalAnswer } from '$lib/rocq/type';
	import Draggable from '$lib/components/Draggable.svelte';
	import { type SyntaxError } from '$lib/notebook/nodes/proof/errors';
	import { comparePosition, visit } from '$lib/notebook/utils';
	import type { NotebookState } from '$lib/notebook/structure';
	import type { ProofNodeValue } from '$lib/notebook/nodes/proof/structure';
	import type { RocqNodeValue } from '$lib/notebook/nodes/rocq/structure';
	import { addPosition, positionAfterString } from '$lib/rocq/utils';

	let {
		chunks,
		position,
		hide,
		state: root,
		node_position
	}: {
		state: NotebookState;
		chunks: ProofChunk[];
		position: number;
		hide?: boolean;
		node_position: number[];
	} = $props();

	const code = $derived(
		chunks
			.slice(0, position + 1)
			.filter((v) => v.type === 'tactic')
			.map((v) => v.code)
			.join('')
	);

	let selected_chunk = $derived(chunks[position]);

	const rocq_position: Position = $derived.by(() => {
		const before = chunks
			.slice(0, position + 1)
			.filter((v) => v.type === 'tactic')
			.map((v) => v.code)
			.join('');

		return positionAfterString(before);
	});

	const worker = getContext<RocqWorker>(WORKER_CONTEXT);
	const connection = $derived(worker.connection);

	let rocq_state: GoalAnswer<string, string> | undefined = $state();
	$effect(() => {
		if (!connection) {
			return undefined;
		}
		chunks;
		rocq_position;
		let uri = 'file:///exercise/main.v';
		let languageId = 'rocq';
		let version = 1;

		let before = '';
		visit(root, (node, pos) => {
			if (comparePosition(pos, node_position) != 1) return;
			if (node.type === 'proof') {
				before += cnltoRocq((node as ProofNodeValue).value);
			}
			if (node.type === 'rocq') {
				before += (node as RocqNodeValue).value.trim() + '\n';
			}
		});
		let before_position = positionAfterString(before);
		let text = before + code;
		let textDocument = types.TextDocumentItem.create(uri, languageId, version, text);
		let openParams: proto.DidOpenTextDocumentParams = { textDocument };
		connection.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams).then(() =>
			connection
				.sendRequest('proof/goals', {
					textDocument: { uri, version } satisfies proto.VersionedTextDocumentIdentifier,
					position: addPosition(before_position, rocq_position),
					pp_format: 'String',
					mode: 'After'
				})
				.catch(console.error)
				.then((v) => {
					console.log(v);
					rocq_state = v as GoalAnswer<string, string>;
				})
		);
	});

	let draggable: Draggable | undefined = $state(undefined);

	let goals = $derived(rocq_state?.goals);
	let goal = $derived(goals?.goals[0]);

	let hyps = $derived(goal?.hyps);
</script>

<Draggable bind:this={draggable}>
	{#if hide !== true && selected_chunk}
		<div class="b-1 rounded-mdtext-nowrap flex h-full w-full flex-col text-black shadow-lg">
			<div class="min-w-20 rounded-t-md border-surface-600-400 bg-surface-600-400">
				<h4 class="mx-auto my-0 w-fit">Goal</h4>
			</div>
			<div class="rounded-b-md bg-white p-2">
				{#if selected_chunk.type === 'error'}
					<div class="rounded-md bg-red-500 p-2">
						{#if 'fatal' in selected_chunk}
							Fatal Error
						{:else}
							{@const reason = (selected_chunk as SyntaxError).reason}
							{reason}
						{/if}
					</div>
				{:else}
					<ul>
						{#each hyps as h}
							<li>
								{h.names.join(',')} : {h.ty}
							</li>
						{/each}
					</ul>

					<h4>{goal?.ty}</h4>
				{/if}
			</div>
		</div>
	{/if}
</Draggable>
