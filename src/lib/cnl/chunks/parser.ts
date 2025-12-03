import {
	isFallbackTactic,
	resolve_state_actions,
	type CnlParsingState,
	type CnlTactic
} from '../cnl_tactic';
import { parse_cnl_chained } from '../tactic_parser';
import type { CnlContent, CnlLine, CnlParagraph, CnlPosition, CnlRoot } from '../tree';
import {
	CHILD_WITHOUT_PARAGRAPH_BEGIN,
	FATAL_ERROR,
	TACTIC_AFTER_LINE_END,
	TACTIC_NOT_RECOGNISED,
	type ErrorGenerator
} from './errors';
import { collapsedRange, isRangeCollapsed, linePosition } from './range';
import { getStateAfterChunks } from './state';
import { COMMENT, TACTIC, type CnlChunk, type TacticChunk } from './types';

export type CnlParser = (root: CnlRoot) => CnlChunk[];

function getLineEndStructure_chunkIndex(chunk: CnlChunk[]): number | -1 {
	return chunk.findIndex(
		(v) => v.type === 'tactic' && v.tactic.spec.footer.structure && !isFallbackTactic(v.tactic)
	);
}

function getStructureSpecification(chunks: CnlChunk[]): CnlTactic | undefined {
	return chunks.findLast((v) => v.type === 'tactic')?.tactic;
}

function turnToErroChunks(
	chunks: CnlChunk[],
	offset: number = 0,
	generator: ErrorGenerator
): CnlChunk[] {
	return [
		...chunks.slice(0, offset),
		...chunks
			.slice(offset)
			.map((v) => (v.type !== 'comment' ? generator(v.state_before, v.range) : v))
	];
}

function resolve_state_actions_chunks(state: CnlParsingState, chunks: CnlChunk[]): CnlParsingState {
	return resolve_state_actions(
		state,
		chunks.map((v) => (v.type === 'tactic' ? v.tactic.spec.footer.actions : [])).flat()
	);
}

/**
 * Define a new reusable parser
 * @param tactics the cnl tactics this parser may use
 * @param initial_state the initial state of parsing
 * @returns a parser (function) which can be used to turn cnl tree into cnl chunks list
 */
export function newCnlParser(tactics: CnlTactic[], initial_state: CnlParsingState): CnlParser {
	function parseRoot(state: CnlParsingState, root: CnlRoot): CnlChunk[] {
		const { before_chunks: _before_chunks, chunks: _chunks } = parseContent(
			state,
			[],
			[],
			root.value
		);

		let chunks: CnlChunk[] = _before_chunks.concat(_chunks);

		const end_state = resolve_state_actions_chunks(state, chunks);

		const fatal_i = chunks.findIndex((v) => v.type === 'error' && 'fatal' in v);
		if (fatal_i !== -1) {
			chunks = chunks
				.slice(0, fatal_i)
				.concat(
					chunks
						.slice(fatal_i)
						.map((v) => (v.type === 'comment' ? v : FATAL_ERROR(end_state, v.range)))
				);
		}

		return chunks;
	}

	function parseEmpty(
		before_state: CnlParsingState,
		position: CnlPosition,
		before_chunks: CnlChunk[]
	): {
		before_chunks: CnlChunk[];
		after_before_state: CnlParsingState;
		chunks: CnlChunk[];
	} {
		const state = getStateAfterChunks(before_state, before_chunks);
		const { ends, result } = parse_cnl_chained(tactics, '', state, false);

		let chunks: CnlChunk[] = result.map((v, i) =>
			TACTIC(
				v,
				resolve_state_actions(
					state,
					result
						.slice(0, i)
						.map((v) => v.tactic.spec.footer.actions)
						.flat()
				),
				linePosition(position, i == 0 ? 0 : ends[i - 1], ends[i])
			)
		);

		return {
			before_chunks: before_chunks,
			after_before_state: state,
			chunks: chunks
		};
	}

	function parseParagraph(
		before_state: CnlParsingState,
		position: CnlPosition,
		before_chunks: CnlChunk[],
		paragraph: CnlParagraph
	): {
		before_chunks: CnlChunk[];
		after_before_state: CnlParsingState;
		chunks: CnlChunk[];
	} {
		let {
			after_before_state: line_after_before_state,
			before_chunks: line_before_chunks,
			chunks: line_chunks
		} = parseLine(before_state, position.concat(0), before_chunks, paragraph.line);

		let before_structure =
			getStructureSpecification(line_chunks)?.spec.footer.structure?.specification;
		let state = line_after_before_state;

		if (before_structure !== 'begin_of_paragraph') {
			let parsed_empty = parseEmpty(
				getStateAfterChunks(line_after_before_state, line_chunks),
				position,
				line_chunks
			);

			line_chunks = parsed_empty.before_chunks;
			line_chunks = line_chunks.concat(parsed_empty.chunks);
			state = parsed_empty.after_before_state;
			before_structure =
				getStructureSpecification(line_chunks)?.spec.footer.structure?.specification;
		}

		let paragraph_before: CnlChunk[] = line_chunks;
		let paragraph_chunks: CnlChunk[] = [];

		if (paragraph.content) {
			let {
				after_before_state: content_after_before_state,
				before_chunks: content_before_chunks,
				chunks: content_chunks
			} = parseContent(
				line_after_before_state,
				position.concat(1),
				paragraph_before,
				paragraph.content
			);

			paragraph_before = content_before_chunks;
			paragraph_chunks = paragraph_chunks.concat(content_chunks);
			state = content_after_before_state;
		}

		if (paragraph.content && before_structure !== 'begin_of_paragraph') {
			paragraph_chunks = turnToErroChunks(
				paragraph_chunks,
				undefined,
				CHILD_WITHOUT_PARAGRAPH_BEGIN
			);
		}

		{
			let parsed_empty = parseEmpty(
				getStateAfterChunks(line_after_before_state, line_chunks.concat(paragraph_chunks)),
				position,
				paragraph_chunks
			);

			paragraph_chunks = parsed_empty.before_chunks.concat(parsed_empty.chunks);
		}

		let after_structure =
			getStructureSpecification(paragraph_chunks)?.spec?.footer?.structure?.specification;

		if (paragraph.content && after_structure !== 'end_of_paragraph') {
			paragraph_chunks = paragraph_chunks.concat(
				FATAL_ERROR(
					resolve_state_actions_chunks(before_state, before_chunks.concat(paragraph_chunks)),
					collapsedRange(position, -1)
				)
			);
		}

		return {
			before_chunks: line_before_chunks,
			after_before_state: line_after_before_state,
			chunks: line_chunks.concat(paragraph_chunks)
		};
	}

	function parseContent(
		before_state: CnlParsingState,
		position: CnlPosition,
		before_chunks: CnlChunk[],
		content: CnlContent
	): {
		before_chunks: CnlChunk[];
		after_before_state: CnlParsingState;
		chunks: CnlChunk[];
	} {
		let {
			before_chunks: after_first_before_chunks,
			after_before_state: after_first_after_before_state,
			chunks: after_first_chunks
		} = parseParagraph(before_state, position.concat(0), before_chunks, content.value[0]);

		let chunks: CnlChunk[] = [];
		let iter_state = after_first_after_before_state;
		let iter_before = after_first_chunks;

		for (let i = 1; i < content.value.length; i++) {
			let {
				after_before_state: _after_before_state,
				before_chunks: _before_chunks,
				chunks: _chunks
			} = parseParagraph(iter_state, position.concat(i), iter_before, content.value[i]);

			chunks.push(...iter_before);

			iter_state = _after_before_state;
			iter_before = _chunks;
		}
		chunks.push(...iter_before);

		return {
			before_chunks: after_first_before_chunks,
			after_before_state: after_first_after_before_state,
			chunks: chunks
		};
	}

	/**
	 *
	 * @param before_state the cnl parsing state at the beggining of this line before the current before_chunks
	 * @param position the position of the line node
	 * @param before_chunks the chunks before this node that might be modified by its parsing
	 * @param line the line node
	 * @returns the modified chunks (modified or not) and the chunks parsed by this line
	 */
	function parseLine(
		before_state: CnlParsingState,
		position: CnlPosition,
		before_chunks: CnlChunk[],
		line: CnlLine
	): {
		before_chunks: CnlChunk[];
		after_before_state: CnlParsingState;
		chunks: CnlChunk[];
	} {
		const state = getStateAfterChunks(before_state, before_chunks);
		const { ends, result } = parse_cnl_chained(tactics, line.value, state, true);

		let chunks: CnlChunk[] = result.map((v, i) =>
			TACTIC(
				v,
				resolve_state_actions(
					state,
					result
						.slice(0, i)
						.map((v) => v.tactic.spec.footer.actions)
						.flat()
				),
				linePosition(position, i == 0 ? 0 : ends[i - 1], ends[i])
			)
		);

		let error_range = linePosition(
			position,
			result.length === 0 ? 0 : ends[ends.length - 1],
			line.value.length
		);

		let after_chunks = resolve_state_actions_chunks(state, chunks);

		// If there is text which was not parsed, then the text represents a syntax error
		if (!isRangeCollapsed(error_range)) {
			chunks.push(TACTIC_NOT_RECOGNISED(after_chunks, error_range));
		}

		chunks = chunks.map((v) =>
			v.type === 'tactic' && v.tactic.name?.toLocaleLowerCase() === 'comment'
				? COMMENT(v, after_chunks, v.range)
				: v
		);

		const line_stop = getLineEndStructure_chunkIndex(chunks);
		const tactic_after_stop = chunks.slice(line_stop + 1).find((v) => v.type !== 'comment');

		// If there are tactics after a tactic which was marked as line end, then those tactics are error
		if (line_stop !== -1 && tactic_after_stop) {
			chunks = turnToErroChunks(chunks, line_stop + 1, TACTIC_AFTER_LINE_END);
		}

		return {
			before_chunks: before_chunks,
			after_before_state: state,
			chunks: chunks
		};
	}

	return (root: CnlRoot) => parseRoot(initial_state, root);
}
