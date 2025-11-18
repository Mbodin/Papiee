import type { NotebookState } from '$lib/notebook/structure';
import type { Position } from 'vscode-languageserver-types';
import type { ProofChunk } from '../../nodes/proof/chunk';
import type { ErrorChunk } from '$lib/notebook/nodes/proof/errors';

export type ProofStateProps = {
	hide?: boolean;
	code: string;
	position?: Position;
	error?: ErrorChunk;
};

export let proof_state_value: { value: undefined } | { value: ProofStateProps } = $state({
	value: undefined
});
