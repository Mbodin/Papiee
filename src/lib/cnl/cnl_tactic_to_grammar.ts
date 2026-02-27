import type { CompiledRules, Grammar, ParserRule, Symbol } from 'nearley';
import type { CnlTactic } from './cnl_tactic';
import { Lexer } from './lexer';
import type {
	Reference,
	Iteration,
	Either,
	SpecificationContent,
	SpecificationContentNode,
	StateFilter,
	Text
} from './cnl_tactic_specifier';
import { get_references } from './cnl_tactic_specifier';

/**
 * A state filter is by definition
 * - '*' if accessible from all states
 * - [] if accessible from no states
 * - [v1, v2, ..., vn] if {@link CnlParsingState} starts with [v1, v2, ..., vn]
 * @param filter 
 * @returns a valid name to be used in the grammar
 */
export function filterToName(filter?: StateFilter): string {
	if (filter === '*') return 'ANYTHING';
	if (!filter || filter.length == 0) return `FILTER_DEFAULT`;
	return `FILTER_${filter.map((v) => v.toUpperCase()).join('$')}`;
}

export function generate(): string {
	return crypto.randomUUID().replace('-', '_');
}

/**
 * Build and set the grammar in the {@link CnlTactic} from the rules stored in the object
 * @param tactic 
 * @returns the linked grammar
 */
export function attach_grammar(tactic: CnlTactic): CompiledRules {
	const reference_value_type: Map<string, 'unique' | 'list'> = new Map();

	const _space_0_id = generate() + '#SPACE_0';
	const _space_1_id = generate() + '#SPACE_1';
	const SPACE_0: ParserRule[] = [
		{ name: _space_0_id, symbols: [_space_1_id, _space_0_id] },
		{ name: _space_0_id, symbols: [] }
	];
	const SPACE_1: ParserRule[] = [
		{
			name: _space_1_id,
			symbols: [{ literal: ' ' }],
			postprocess: (d) => d[0].value
		}
	];

	const _everything = generate() + '#EVERYTHING';
	const EVERYTHING: ParserRule[] = [
		{
			name: _everything,
			symbols: [
				{
					test: (v: any) => {
						if (typeof v === 'object' && 'value' in v) v = v.value;
						return typeof v === 'string';
					}
				} as Symbol,
				_everything
			],
			postprocess: (d, loc, reject) =>
					d
					.flat()
					.map((v) => (typeof v === 'string' ? v : v?.value || ''))
					.join('')
		},
		{
			name: _everything,
			symbols: [
				{
					test: (v: any) => {
						if (typeof v === 'object' && 'value' in v) v = v.value;
						return typeof v === 'string' || (typeof v === 'object' && v.type === 'stop_everything');
					}
				} as Symbol
			],
			postprocess(d, loc, reject) {
				if (typeof d[0] === 'object' && d[0].type === 'stop_everything') return undefined;
				return d
					.flat()
					.map((v) => (typeof v === 'string' ? v : v.value))
					.join('');
			}
		}
	];

	const spec = tactic.spec;

	// Return a triple:
	// - A symbol corresponding to the non-terminal recognizing the current node.
	// - Symbols that have been defined for subnodes,
	// - The associated rules.
	function specification_node(v: SpecificationContentNode): [string, [string], ParserRule[]] {
		switch (v.type) {
			case 'text':
				return text(v);
			case 'reference':
				return reference(v);
			case 'iteration':
				return iteration(v);
			case 'either':
				return either(v);
			default:
				throw new Error(`${v as any} is unknown`);
		}
	}

	function text(v: Text): [string, [string], ParserRule[]] {
		const id = generate();

		return [
			id,
			[id],
			[
				{
					name: id,
					symbols: [...v.value]
						.map((v) => (v === ' ' ? [_space_1_id, _space_0_id] : [{ literal: v }]))
						.flat(),
					postprocess: (v) => v.map((v) => v.text).join('')
				} as ParserRule
			]
		];
	}

	function reference(v: Reference): [string, [string], ParserRule[]] {
		const id = generate() + '_' + v.value + '#REF' + v.value;
		if (reference_value_type.has(v.value)) reference_value_type.set(v.value, 'list');
		else reference_value_type.set(v.value, 'unique');

		return [
			id,
			[id],
			[
				{
					name: id,
					symbols: [_everything],
					postprocess: (d, loc, reject) => ({
							type: v.value,
							value: d[0]
						}),
					test: 1
				} as ParserRule
			]
		];
	}

	function either(e: Either): [string, [string], ParserRule[]] {
		const id_global = generate() ;

		const sub =
			e.contents.map ((c, i) => {
					const id = generate() + '_' + i + '#CASE' + i;
					const [inner_node, states, rules] = specification_node(c);

					return [
						id,
						[id, ...states],
						[
							{
								name: id,
								symbols: [inner_node],
								postprocess: d => d.join ("")
							} as ParserRule,
							...rules
						]
					]
				}) ;

		return [
			id_global,
			[id_global, ...sub.flatMap(([inner_node, states, rules]) => states)],
			sub.flatMap(([inner_node, states, rules]) => rules)
		]
	}

	function iteration(i: Iteration): [string, [string], ParserRule[]] {
		const id = generate() ;
		const [inner_node, states, rules] = specification_node(i.content) ;

		get_references(i.content).forEach(v => reference_value_type.set(v.value, 'list')) ;


		return [
			id,
			[id, ...states],
			[
				{
					name: id,
					symbols: [],
					postprocess: () => null
				} as ParserRule,
				{
					name: id,
					symbols: [id, inner_node],
					postprocess: d => d[0].concat([d[1]])
				} as ParserRule,
				...rules
			]
		] ;
	}

	const compiled_content = spec.content.map((v) => specification_node(v));

	const main_rule: ParserRule[] = [
		{
			name: filterToName(spec.header.states),
			symbols: [...compiled_content.flatMap(([id, states, rules]) => states)],
			postprocess(v) {
				const references = v
					.flat(Infinity)
					.filter((v) => typeof v === 'object')
					.map((v) => v as { type: string; value: string });

				const keys = [...new Set(references.map((v) => v.type))];

				return {
					tactic,
					value: Object.fromEntries(
						keys.map((v) => {
							const values = references.filter((o) => o.type === v);

							if (values.length === 1 && reference_value_type.get(values[0].type) === 'unique')
								return [v, values[0].value];
							return [v, values.map((o) => o.value)];
						})
					)
				};
			}
		}
	];

	const grammar = {
		Lexer: new Lexer(),
		ParserRules: compiled_content
			.flatMap(([id, states, rules]) => rules)
			.concat([...SPACE_0, ...SPACE_1, ...EVERYTHING, main_rule]),
		ParserStart: filterToName(spec.header.states)
	};
	tactic.grammar = grammar;

	return grammar;
}
