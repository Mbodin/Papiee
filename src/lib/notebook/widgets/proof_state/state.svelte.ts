import type { Position } from 'vscode-languageserver-types';
import type { ErrorChunk } from '$lib/cnl/chunks/errors';
import type { GoalAnswer } from '$lib/rocq/type';

export type ProofStateProps = {
	hide?: boolean;
	code: string;
	position?: Position;
	error?: ErrorChunk;
};

export type RocqStateProps = {
	value?: GoalAnswer<string, string>;
	error?: ErrorChunk;
	hide?: boolean;
};

export let proof_state_value: { value: undefined } | { value: ProofStateProps } = $state({
	value: undefined
});
