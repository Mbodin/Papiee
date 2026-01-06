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

/**
 * Used to represent a generic error
 * 
 * Should not be used, please define another error if needed
 */
export const FATAL_ERROR = error({ fatal: 1 });

/**
 * Used to create error for proof element written after one proof element recorded a line end
 */
export const PROOF_ELEMENT_AFTER_LINE_END = syntax('tactic_after_line_end');

/**
 * Used to create error for proof element placed as a child in a paragraph where the header content did not record a paragraph begin
 */
export const CHILD_WITHOUT_PARAGRAPH_BEGIN = syntax('child_without_paragraph_begin');


/**
 * Used to create error for proof element placed as a child in a paragraph where one of the previous sibling recorded a paragraph end
 */
export const PARAGRAPH_ALREADY_ENDED = syntax('paragraph_already_ended');

/**
 * Used to create error for proof element that was not recognized
 */
export const PROOF_ELEMENT_NOT_RECOGNISED = syntax('tactic_not_recognized');
