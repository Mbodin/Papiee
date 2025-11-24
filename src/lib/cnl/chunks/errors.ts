import type { Range } from './range';
import type { ChunkGenerator } from './types';

type CommonErrorFields = {
	type: 'error';
	range: Range;
};

export type ErrorChunk = SyntaxError | CommonErrorFields;

export type SyntaxError = {
	type: 'error';
	range: Range;
	reason: string;
};

export type ErrorGenerator<T extends CommonErrorFields = CommonErrorFields> = ChunkGenerator<T>;

export function error<T extends CommonErrorFields>(
	value?: Omit<T, 'range' | 'type'>
): ErrorGenerator<T> {
	return (range) => ({ ...(value || {}), range, type: 'error' }) as T;
}

export function syntax(reason: string) {
	return error({ reason });
}

export const TACTIC_AFTER_LINE_END = syntax('tactic_after_line_end');
export const CHILD_WITHOUT_PARAGRAPH_BEGIN = syntax('child_without_paragraph_begin');
export const PARAGRAPH_ALREADY_ENDED = syntax('paragraph_already_ended');
export const FATAL_ERROR = error({ fatal: 1 });
export const TACTIC_NOT_RECOGNISED = syntax('tactic_not_recognized');
