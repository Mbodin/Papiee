import type { CompiledRules, ParserRule } from 'nearley';
import { getTactics, resolve_state_actions, type CnlTactic } from './cnl_tactic';
import { filterToName } from './cnl_tactic_to_grammar';
import { Lexer } from './lexer';

function rename_string(v: string, src: string, target: string) {
	return v === src ? target : v;
}

function rename_symbol(rules: CompiledRules, src: string, target: string): CompiledRules {
	const renaming = (v: string) => rename_string(v, src, target);

	return {
		...rules,
		Lexer: rules.Lexer,
		ParserStart: renaming(rules.ParserStart),
		ParserRules: rules.ParserRules.map((v) => ({
			name: renaming(v.name),
			symbols: v.symbols.map((v) => (typeof v === 'string' ? renaming(v) : v)),
			postprocess: v.postprocess
		}))
	};
}

export type ParseResult<T = unknown> = { tactic: CnlTactic; value: T };

export default function tactic_grammar(tactics?: CnlTactic[], state?: string[]): CompiledRules {
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
