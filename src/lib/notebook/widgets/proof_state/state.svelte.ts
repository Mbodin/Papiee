import type { Position } from 'vscode-languageserver-types';
import type { ErrorChunk } from '$lib/cnl/chunks/errors';
import type { GoalAnswer, Pp } from '$lib/rocq/pp';

export type ProofStateProps = {
	hide?: boolean;
	code: string;
	position?: Position;
	error?: ErrorChunk;
};

export type RocqStateProps = {
	value?: GoalAnswer<Pp, Pp>;
	error?: ErrorChunk;
	hide?: boolean;
	loading?: boolean;
};

export let proof_state_value: { value: undefined } | { value: ProofStateProps } = $state({
	value: undefined
});
