import type { ErrorChunk } from '$lib/cnl/chunks/errors';
import type { CnlParsingState, ParseResult } from '../cnl_tactic';
import type { Range } from './range';

/**
 * A Chunk represents is a metadata on a string slice
 * 
 * Chunk can be parsed, or a text slice that represents an error
 * We also provide a way to mark chunks as comment to be transparent during the evaluation
 */
export type CnlChunk = ErrorChunk | CommentChunk | ParsedChunk;

/**
 * A chunk generator is used to get a chunk from a before state and a range (by default)
 * 
 * Sometime generators can be defined to use more than just those two parameters
 */
export type ChunkGenerator<T = CnlChunk, U extends Array<Object> = [CnlParsingState, Range]
> = (...args: U) => T;

export type CommentChunk = {
	type: 'comment';
	range: Range;
	comment_code: string;
	state_before: CnlParsingState;
} & ParseResult;

export type ParsedChunk = {
	type: 'parsed';
	range: Range;
	code: string;
	state_before: CnlParsingState;
} & ParseResult;

// Comment chunk generator
export const COMMENT: ChunkGenerator<CommentChunk, [ParseResult, CnlParsingState, Range]> = (
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

// Parsed chunk generator
export const PARSED: ChunkGenerator<ParsedChunk, [ParseResult, CnlParsingState, Range]> = (
	result: ParseResult,
	state_before: CnlParsingState,
	range: Range
): ParsedChunk => ({
	...result,
	range,
	code: result.tactic.transformer({ value: result.value as any }),
	state_before,
	type: 'parsed'
});
