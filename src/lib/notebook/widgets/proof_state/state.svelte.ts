import type { ProofChunk } from '../../nodes/proof/chunk';

export let proof_state_value:
	| { value: undefined }
	| { value: { chunks: ProofChunk[]; position: number; hide?: boolean } } = $state({
	value: undefined
});
