import type { CnlParsingState } from '../cnl_tactic';
import type { Range } from './range';
import type { ChunkGenerator } from './types';

type CommonErrorFields = {
	type: 'error';
	range: Range;
	state_before: CnlParsingState;
};

export type ErrorChunk = SyntaxError | CommonErrorFields;

export type SyntaxError = {
	type: 'error';
	range: Range;
	reason: string;
	state_before: CnlParsingState;
};

export type ErrorGenerator<T extends CommonErrorFields = CommonErrorFields> = ChunkGenerator<T>;

export function error<T extends CommonErrorFields>(
	value?: Omit<T, 'range' | 'type' | 'state_before'>
): ErrorGenerator<T> {
	return (state_before, range) => ({ ...(value || {}), range, type: 'error', state_before }) as T;
}

export function syntax(reason: string) {
	return error({ reason });
}

export const TACTIC_AFTER_LINE_END = syntax('tactic_after_line_end');
export const CHILD_WITHOUT_PARAGRAPH_BEGIN = syntax('child_without_paragraph_begin');
export const PARAGRAPH_ALREADY_ENDED = syntax('paragraph_already_ended');
export const FATAL_ERROR = error({ fatal: 1 });
export const TACTIC_NOT_RECOGNISED = syntax('tactic_not_recognized');
