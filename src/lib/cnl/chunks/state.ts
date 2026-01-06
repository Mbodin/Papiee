import { resolve_state_actions, type CnlParsingState } from '../cnl_tactic';
import type { CnlChunk, ParsedChunk } from './types';

/**
 * Resolve all state actions inside the chunks
 * Comment and error chunks are ignored
 * 
 * @param state initial {@link CnlParsingState}
 * @param chunks chunks to be considered
 * @returns the resolved {@link CnlParsingState} after the chunks
 */
export function getStateAfterChunks(state: CnlParsingState, chunks: CnlChunk[]): CnlParsingState {
	return resolve_state_actions(
		state,
		chunks
			.filter((v) => v.type === 'parsed')
			.flatMap((v) => (v as ParsedChunk).tactic.spec.footer.actions)
	);
}
