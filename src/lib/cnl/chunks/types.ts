import type { ErrorChunk } from '$lib/cnl/chunks/errors';
import type { CnlParsingState, ParseResult } from '../cnl_tactic';
import type { StructureSpecification } from '../cnl_tactic_specifier';
import type { Range } from './range';

export type CnlChunk = ErrorChunk | CommentChunk | TacticChunk;

export type ChunkGenerator<T = CnlChunk> = (state_before: CnlParsingState, range: Range) => T;

export type CommentChunk = {
	type: 'comment';
	range: Range;
	comment_code: string;
	state_before: CnlParsingState;
} & ParseResult;

export type TacticChunk = {
	type: 'tactic';
	range: Range;
	code: string;
	state_before: CnlParsingState;
} & ParseResult;

export const COMMENT = (
	result: ParseResult,
	state_before: CnlParsingState,
	range: Range
): CommentChunk => ({
	...result,
	range,
	comment_code: result.tactic.transformer({ value: result.value as any }),
	state_before,
	type: 'comment'
});

export const TACTIC = (
	result: ParseResult,
	state_before: CnlParsingState,
	range: Range
): TacticChunk => ({
	...result,
	range,
	code: result.tactic.transformer({ value: result.value as any }),
	state_before,
	type: 'tactic'
});
