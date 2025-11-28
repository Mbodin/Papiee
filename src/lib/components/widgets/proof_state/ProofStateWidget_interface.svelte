<script lang="ts">
	import { proof_state_value as imported_proof_state_value } from '$lib/notebook/widgets/proof_state/state.svelte';
	import { getContext } from 'svelte';
	import ProofStateWidget from './ProofStateWidget.svelte';
	import { WORKER_CONTEXT, type RocqWorker } from '$lib/rocq/connection';
	import * as types from 'vscode-languageserver-types';
	import type { GoalAnswer } from '$lib/rocq/type';
	import { fromPositionToIndex, minPosition, positionAfterString } from '$lib/rocq/utils';
	import { debounced_get } from '$lib/svelte/debounced.svelte';
	import { value_derived, value_derived_trivial } from '$lib/svelte/derived.svelte';
	import { Loader } from '@lucide/svelte';
	import Draggable from '$lib/components/Draggable.svelte';

	const proof_state_value = value_derived(
		() => imported_proof_state_value.value,
		(a, b) => {
			if (!a && !b) return true;
			if (!a || !b) return false;
			if (a.error !== b.error) return false;
			if (a.hide !== b.error) return false;

			const a_v = fromPositionToIndex(a.code, a.position || positionAfterString(a.code));
			const b_v = fromPositionToIndex(b.code, b.position || positionAfterString(b.code));
			return a.code.substring(0, a_v).trim() === b.code.substring(0, b_v).trim();
		}
	);

	const worker = getContext<RocqWorker>(WORKER_CONTEXT);
	const connection = $derived(worker.connection);
	let rocq: GoalAnswer<string, string> | undefined = $state();
	let position = $derived(
		proof_state_value.value?.position || positionAfterString(proof_state_value.value?.code || '')
	);
	let value = $derived(proof_state_value.value);
	let _code = value_derived_trivial(() => proof_state_value.value?.code || '');
	let code = $derived(_code.value);

	const debounced_extraction = debounced_get(
		async (args: { code: string; position: types.Position } | undefined) => {
			if (!args) return undefined;
			let { code, position } = args;
			position = minPosition(position, positionAfterString(code));
			if (!connection) {
				return undefined;
			}
			return await connection.transient_file(({ document }) => {
				return connection.sendRequest('proof/goals', {
					textDocument: { uri: document.uri, version: document.version },
					position: { ...position },
					pp_format: 'Str',
					mode: 'After'
				}) as Promise<GoalAnswer<string, string>>;
			}, code);
		},
		20
	);
	let loading = $derived(debounced_extraction.waiting || debounced_extraction.running);

	$effect(() => {
		debounced_extraction(proof_state_value && code !== '' ? { code, position } : undefined).then(
			(new_rocq) => {
				rocq = new_rocq;
			}
		);
	});
</script>

<Draggable>
	<div
		class="b-1 rounded-mdtext-nowrap flex h-full w-full flex-col rounded-lg bg-white text-black shadow-lg"
	>
		{#if rocq}
			<ProofStateWidget error={value?.error} hide={value?.hide} value={rocq} />
		{/if}
		{#if loading}
			<Loader class="mx-auto animate-spin" />
		{/if}
	</div>
</Draggable>
