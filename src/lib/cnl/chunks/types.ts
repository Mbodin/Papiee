import type { ErrorChunk } from '$lib/cnl/chunks/errors';
import type { ParseResult } from '../cnl_tactic';
import type { StructureSpecification } from '../cnl_tactic_specifier';
import type { Range } from './range';

export type CnlChunk = ErrorChunk | CommentChunk | TacticChunk;

export type ChunkGenerator<T = CnlChunk> = (range: Range) => T;

export type CommentChunk = {
	type: 'comment';
	range: Range;
	comment_code: string;
} & ParseResult;

export type TacticChunk = {
	type: 'tactic';
	range: Range;
	code: string;
} & ParseResult;

export const COMMENT = (result: ParseResult, range: Range): CommentChunk => ({
	...result,
	range,
	comment_code: result.tactic.transformer(result.value as any),
	type: 'comment'
});

export const TACTIC = (result: ParseResult, range: Range): TacticChunk => ({
	...result,
	range,
	code: result.tactic.transformer(result.value as any),
	type: 'tactic'
});
