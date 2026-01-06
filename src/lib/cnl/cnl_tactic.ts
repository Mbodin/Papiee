import type { CompiledRules, ParserRule } from 'nearley';
import { attach_grammar, filterToName } from './cnl_tactic_to_grammar';
import nearley from 'nearley';
import rules, { type Specification, type StateAction } from './cnl_tactic_specifier';
import type { ParseError } from '$lib/parsing';
import { Lexer } from './lexer';

const { Grammar, Parser } = nearley;
const grammar = Grammar.fromCompiled(rules);

const newSpecificationParser = () => new Parser(grammar);
const fromStringToSpecification = (v: string) => {
	const parser = newSpecificationParser();

	try {
		parser.feed(v);
	} catch (e) {
		return e as ParseError;
	}
	return parser.results[0]! as Specification;
};

export type CnlTactic<T = any> = {
	name?: string;
	textual: string;
	spec: Specification;
	grammar?: CompiledRules;
	transformer: Transformer<T>;
};

export type CnlParsingState = string[];

/**
 * A fallback tactic is defined using empty content, it's a tactic supposed to be called when no other way is available
 * @param tactic
 * @returns true if the content is empty, false otherwise
 */
export function isFallbackTactic(tactic: CnlTactic<unknown>): boolean {
	return tactic.spec.content.length === 0;
}

/**
 * Compute the final {@link CnlParsingState} from an initial state and a list of actions
 * @param state the initial state
 * @param actions the list of actions
 * @returns the resolved {@link CnlParsingState}
 */
export function resolve_state_actions(state: CnlParsingState, actions: StateAction[]) {
	const _state = [...state];

	actions.forEach((action) => {
		switch (action.action) {
			case 'pop': {
				_state.pop();
				break;
			}
			case 'push': {
				_state.push(action.value);
				break;
			}
		}
	});

	return _state;
}

const registry: CnlTactic[] = [];

export function getTactics() {
	return Array.from(registry);
}

export type TransformerContext<T = any> = {
	value: T;
};

export type Transformer<T> = (value: TransformerContext<T>) => string;

/**
 * Parse {@link CnlTactic} from the string representation
 * @param name the optional name of the tactic, usefull for debugging purpose
 * @param textual the textual representation
 * @param transformer the function to convert parsed object into rocq code
 * @returns a {@link CnlTactic}
 */
export function createTacticFromTextual<T = any>(
	name: string | undefined,
	textual: string,
	transformer: Transformer<T>
) {
	const spec = fromStringToSpecification(textual.trim());

	if ('name' in spec) {
		console.error('Error while parsing rule', name);
		throw new Error(
			'Error while parsing rule ' + textual + (name ? '(' + name + ')' : '') + '\n' + spec.message
		);
	}

	const cnl: CnlTactic = {
		name,
		textual,
		spec,
		transformer: (v) => {
			let transformed = transformer(v);
			if (transformed.endsWith('.')) transformed = transformed + ' ';
			return transformed;
		}
	};
	attach_grammar(cnl);

	const existing = registry.find((v) => v.textual === textual);

	if (existing && existing.name === name) return existing;
	if (existing && existing.name !== name) {
		throw new Error(
			'Should not register multiple tactics with the same specification but different name'
		);
	}
	registry.push(cnl);
	return cnl;
}

export type ParseResult<T = unknown> = { tactic: CnlTactic<T>; value: T };

/**
 * Define a global grammar from a list of {@link CnlTactic}
 * @param tactics 
 * @param state 
 * @returns a grammar which should parse proof elements
 */
export function createGlobalGrammarFromTactics(
	tactics?: CnlTactic[],
	state?: CnlParsingState
): CompiledRules {
	if (!tactics) tactics = getTactics();
	if (state == null) state = [];

	const sources = tactics.map((v) => ({
		...v.grammar!,
		tactic: { ...v, grammar: undefined } satisfies CnlTactic
	}));

	return {
		ParserStart: 'main',
		Lexer: new Lexer(),
		ParserRules: sources
			.flatMap((v) => v.ParserRules)
			.concat(
				...Array.from({ length: state.length })
					.map((_, i) => state.slice(i))
					.filter((v) => v.length !== 0) // Only accept empty state array if the initial state array was empty, and we now it's not empty because state.length > 0
					.concat(state.length === 0 ? [[]] : [])
					.map(
						(v): ParserRule => ({
							name: 'main',
							symbols: [filterToName(v)],
							postprocess(d) {
								let _state = [...state];
								const cnl_tactic = d[0] as { tactic: CnlTactic; value: unknown };

								_state = resolve_state_actions(_state, cnl_tactic.tactic.spec.footer.actions);

								return { result: cnl_tactic, state: _state };
							}
						})
					),
				{
					name: 'main',
					symbols: [filterToName('*')],
					postprocess(d) {
						let _state = [...state];
						const cnl_tactic = d[0] as { tactic: CnlTactic; value: unknown };

						_state = resolve_state_actions(_state, cnl_tactic.tactic.spec.footer.actions);

						return { result: cnl_tactic, state: _state };
					}
				}
			)
	};
}
