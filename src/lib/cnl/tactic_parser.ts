import nearley from 'nearley';

import rules, { type StructureSpecification } from './cnl_tactic_specifier';
import {
	createGlobalGrammarFromTactics,
	type CnlParsingState,
	type CnlTactic,
	type ParseResult
} from './cnl_tactic';
import { resolve_state_actions } from './cnl_tactic';

const { Grammar, Parser } = nearley;

export const grammar = Grammar.fromCompiled(rules);

export type CNLParseResult = {
	offset: number;
	result: ParseResult;
	state: CnlParsingState;
};

export type CNLParseResultChained = {
	offset: number;
	result: ParseResult[];
	ends: number[];
	state: CnlParsingState;
	action?: StructureSpecification['specification'];
};

export function parse_cnl(
	tactics: CnlTactic[],
	value: string,
	state?: CnlParsingState
): CNLParseResult | undefined {
	const compiled_rules = createGlobalGrammarFromTactics(tactics, state);
	const grammar = Grammar.fromCompiled(compiled_rules);
	const parser = new Parser(grammar);

	let max: CNLParseResult | undefined = undefined;

	parser.feed([]);
	const results = parser.results as { state: CnlParsingState; result: ParseResult }[];
	if (results && results.length !== 0) {
		const { state, result } = results[0];
		max = {
			offset: 0,
			result,
			state
		};
	}

	for (let i = 0; i < value.length; i++) {
		try {
			parser.feed(value[i]);
		} catch (e) {
			break;
		}

		const results = parser.results as { state: string[]; result: ParseResult }[];
		if (results?.length === 0) continue;
		const { state, result } = results[0];
		return {
			offset: i + 1,
			result,
			state
		};
	}

	return max;
}

export function parse_cnl_chained(
	tactics: CnlTactic[],
	value: string,
	state: CnlParsingState,
	ignore_structre: boolean = false,
	trim_empty_end: boolean = true
): CNLParseResultChained {
	let _state = [...state];
	let _offset = 0;

	let result: ReturnType<typeof parse_cnl> = undefined;
	let parsed: ParseResult[] = [];
	let ends: number[] = [];
	do {
		result = parse_cnl(tactics, value.substring(_offset), _state);
		if (!result) continue;
		_offset += result.offset;
		ends.push(_offset);
		_state = result.state;
		parsed.push(result.result);
	} while (result && (ignore_structre || !result.result.tactic.spec.footer.structure));

	let trim_end_index = ends.findIndex((v) => v === ends[ends.length - 1]);
	if (trim_empty_end && trim_end_index !== ends.length - 1) {
		parsed = parsed.slice(0, trim_end_index + 1);
		_state = resolve_state_actions(
			[...state],
			parsed.map((v) => v.tactic.spec.footer.actions).flat()
		);
		ends = ends.slice(0, trim_end_index + 1);
	}

	return {
		result: parsed,
		state: _state,
		offset: _offset,
		ends,
		action: parsed[parsed.length - 1]?.tactic?.spec?.footer?.structure?.specification
	};
}
