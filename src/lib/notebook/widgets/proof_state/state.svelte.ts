import type { NotebookState } from '$lib/notebook/structure';
import type { ProofChunk } from '../../nodes/proof/chunk';

export let proof_state_value:
	| { value: undefined }
	| {
			value: {
				state: NotebookState;
				chunks: ProofChunk[];
				position: number;
				hide?: boolean;
				node_position: number[];
			};
	  } = $state({
	value: undefined
});
