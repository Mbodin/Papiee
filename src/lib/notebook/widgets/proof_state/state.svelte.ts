import type { Position } from 'vscode-languageserver-types';
import type { ErrorChunk } from '$lib/cnl/chunks/errors';

export type ProofStateProps = {
	hide?: boolean;
	code: string;
	position?: Position;
	error?: ErrorChunk;
};

export let proof_state_value: { value: undefined } | { value: ProofStateProps } = $state({
	value: undefined
});
