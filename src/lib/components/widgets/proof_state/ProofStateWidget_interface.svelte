<script lang="ts">
	import {
		proof_state_value,
		type RocqStateProps
	} from '$lib/notebook/widgets/proof_state/state.svelte';
	import { getContext } from 'svelte';
	import ProofStateWidget from './ProofStateWidget.svelte';
	import { WORKER_CONTEXT, type RocqWorker } from '$lib/rocq/connection';
	import * as proto from 'vscode-languageserver-protocol';
	import * as types from 'vscode-languageserver-types';
	import type { GoalAnswer } from '$lib/rocq/type';
	import { positionAfterString } from '$lib/rocq/utils';

	const worker = getContext<RocqWorker>(WORKER_CONTEXT);
	const connection = $derived(worker.connection);

	async function extractRocqState(code: string, position: types.Position) {
		if (!connection) {
			return undefined;
		}
		let uri = 'file:///exercise/main.v';
		let languageId = 'rocq';
		let version = 1;

		let textDocument = types.TextDocumentItem.create(uri, languageId, version, code);
		let openParams: proto.DidOpenTextDocumentParams = { textDocument };
		await connection.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams);
		const value = await connection
			.sendRequest('proof/goals', {
				textDocument: { uri, version } satisfies proto.VersionedTextDocumentIdentifier,
				position: { ...position },
				pp_format: 'String',
				mode: 'After'
			})
			.catch(console.error);
		return value as GoalAnswer<string, string>;
	}

	let position = $derived(
		proof_state_value.value?.position || positionAfterString(proof_state_value.value?.code || '')
	);

	let debouncing_timeout: NodeJS.Timeout | undefined = undefined;

	$effect(() => {
		if (proof_state_value && proof_state_value.value) {
			if (debouncing_timeout) clearTimeout(debouncing_timeout);
			extractRocqState(proof_state_value.value?.code, position).then((v) => (debounced_rocq = v));
		} else {
			debouncing_timeout = setTimeout(() => {
				debouncing_timeout = undefined;
				debounced_rocq = undefined;
			}, 200);
		}
	});

	let debounced_rocq: RocqStateProps['value'] | undefined = $state(undefined);

	let value = $derived(proof_state_value.value);
</script>

{#if debounced_rocq}
	<ProofStateWidget error={value?.error} hide={value?.hide} value={debounced_rocq} />
{/if}
