<script lang="ts">
	import Draggable from '$lib/components/Draggable.svelte';
	import type { SyntaxError } from '$lib/notebook/nodes/proof/errors';
	import type { ProofStateProps } from '$lib/notebook/widgets/proof_state/state.svelte';
	import { WORKER_CONTEXT, type RocqWorker } from '$lib/rocq/connection';
	import type { GoalAnswer } from '$lib/rocq/type';
	import { positionAfterString } from '$lib/rocq/utils';
	import { getContext } from 'svelte';
	import * as proto from 'vscode-languageserver-protocol';
	import * as types from 'vscode-languageserver-types';

	let {
		hide = false,
		code,
		position = positionAfterString(code),
		error = undefined
	}: ProofStateProps = $props();

	const worker = getContext<RocqWorker>(WORKER_CONTEXT);
	const connection = $derived(worker.connection);

	let rocq_state: GoalAnswer<string, string> | undefined = $state();

	$effect(() => {
		if (!connection) {
			return undefined;
		}
		let uri = 'file:///exercise/main.v';
		let languageId = 'rocq';
		let version = 1;

		let textDocument = types.TextDocumentItem.create(uri, languageId, version, code);
		let openParams: proto.DidOpenTextDocumentParams = { textDocument };
		connection.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams).then(() =>
			connection
				.sendRequest('proof/goals', {
					textDocument: { uri, version } satisfies proto.VersionedTextDocumentIdentifier,
					position: { ...position },
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

	let goals = $derived(rocq_state?.goals);
	let goal = $derived(goals?.goals[0]);

	let hyps = $derived(goal?.hyps);
</script>

<Draggable>
	{#if hide !== true}
		<div class="b-1 rounded-mdtext-nowrap flex h-full w-full flex-col text-black shadow-lg">
			<div class="min-w-20 rounded-t-md border-surface-600-400 bg-surface-600-400">
				<h4 class="mx-auto my-0 w-fit">Goal</h4>
			</div>
			<div class="rounded-b-md bg-white p-2">
				{#if error}
					<div class="rounded-md bg-red-500 p-2">
						{#if 'fatal' in error}
							Fatal Error
						{:else}
							{@const reason = (error as SyntaxError).reason}
							{reason}
						{/if}
					</div>
				{:else}
					<ul>
						{#each hyps as h}
							<li class="text-nowrap">
								{h.names.join(',')} : {h.ty}
							</li>
						{/each}
					</ul>

					<h4 class="text-nowrap">{goal?.ty}</h4>
				{/if}
			</div>
		</div>
	{/if}
</Draggable>
