import { resolve_state_actions, type CnlParsingState } from '../cnl_tactic';
import type { CnlChunk, TacticChunk } from './types';

export function getStateAfterChunks(state: CnlParsingState, chunk: CnlChunk[]): CnlParsingState {
	return resolve_state_actions(
		state,
		chunk
			.filter((v) => v.type === 'tactic')
			.flatMap((v) => (v as TacticChunk).tactic.spec.footer.actions)
	);
}
