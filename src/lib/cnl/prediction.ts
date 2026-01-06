import {
	createGlobalGrammarFromTactics,
	getTactics,
	resolve_state_actions,
	type CnlParsingState
} from './cnl_tactic';
import nearley from 'nearley';
import { parse_cnl_chained } from './tactic_parser';

const { Grammar, Parser } = nearley;

export type StringPrediction = { type: 'string'; value: string };
export type ReferencePrediction = { type: 'reference'; value: string };
export type InputPrediction = (StringPrediction | ReferencePrediction)[];
export type Prediction = {
	inputs: InputPrediction;
	completed: boolean;
};

type ParserSnapshot = unknown;

type _Prediction = Prediction & {
	parser_state: ParserSnapshot;
};

/**
 * Strip a list of predictions from redundat parsings
 * @param predictions 
 * @returns 
 */
function remove_duplicates_prediction<T extends Prediction>(predictions: T[]): T[] {
	return predictions.reduce((predictions: T[], new_prediction) => {
		if (
			predictions.find((prediction) => {
				const p_inputs = prediction.inputs;
				const np_inputs = new_prediction.inputs;

				return (
					p_inputs.length === np_inputs.length &&
					!p_inputs.find(
						(v, i) => !(np_inputs[i].type === v.type && np_inputs[i].value === v.value)
					)
				);
			})
		)
			return predictions;
		return [...predictions, new_prediction];
	}, []);
}

function remove_duplicate_inputprediction(inputs: InputPrediction[]): InputPrediction[] {
	return inputs.reduce((a: InputPrediction[], b) => {
		if (
			a.find((v) => {
				const p_inputs = v;
				const np_inputs = b;

				return (
					p_inputs.length === np_inputs.length &&
					!p_inputs.find(
						(v, i) => !(np_inputs[i].type === v.type && np_inputs[i].value === v.value)
					)
				);
			})
		)
			return a;
		return [...a, b];
	}, []);
}

/**
 * Tries to predict possible continuations of an input
 * @param value the input
 * @param state the {@link CnlParsingState} at the time of the input
 * @param max_iter the maximum number of predictions iterations allowed
 * @returns a list of predictions
 */
export function predict(
	value: string,
	state: CnlParsingState,
	max_iter = 32
): InputPrediction[] | undefined {
	const tactics = getTactics();
	const empty_before = parse_cnl_chained(tactics, '', state, undefined, false);
	let possible_initials = [state].concat(
		empty_before.result.map(
			(_v, i) =>
				resolve_state_actions(
					state,
					empty_before.result
						.slice(0, i + 1)
						.map((v) => v.tactic.spec.footer.actions)
						.flat()
				) as CnlParsingState
		)
	);

	const predictions = possible_initials
		.map((v) => predict_with_state(value, v, max_iter))
		.filter(Boolean)
		.map((v) => v!);
	if (predictions.length === 0) return undefined;
	return remove_duplicate_inputprediction(predictions.flat());
}

function predict_with_state(
	value: string,
	state: CnlParsingState,
	max_iter = 1
): InputPrediction[] | undefined {
	const compiled_rules = createGlobalGrammarFromTactics(undefined, state);
	const grammar = Grammar.fromCompiled(compiled_rules);
	const parser = new Parser(grammar);

	try {
		parser.feed(value);
	} catch (e) {
		return undefined;
	}

	// If input stopped inside a reference we close it to be sure to not pursue inside
	const _everything = parser.table[parser.current].states.find((v) =>
		v.rule.name.endsWith('#EVERYTHING')
	);

	const origin = parser.save();
	let predictions: _Prediction[] = [
		{
			parser_state: origin,
			inputs: [],
			completed: parser.results.length !== 0
		}
	];

	try {
		parser.feed([{ type: 'stop_everything' }]);
		predictions.push({
			parser_state: parser.save(),
			inputs: [],
			completed: parser.results.length !== 0
		});
	} catch (_e) { }

	for (let iter = 0; iter < max_iter; iter++) {
		predictions = predictions.flatMap((prediction) => {
			if (prediction.completed && prediction.inputs.length > 0) return [prediction];
			parser.restore(prediction.parser_state);
			return parser.table[parser.current].states
				.filter((state) => !state.isComplete)
				.flatMap((state) => {
					const symbol = state.rule.symbols[state.dot];
					// Skip rules where we did not enter inside
					if (typeof symbol === 'string' && 'left' in state && 'right' in state) {
						return [];
					}
					if (typeof symbol === 'object' && 'literal' in symbol) {
						const value = String(symbol.literal);
						parser.restore(prediction.parser_state);
						try {
							parser.feed([{ type: 'stop_everything' }]);
						} catch (_e) {
							parser.restore(prediction.parser_state);
						}
						try {
							parser.feed(value);
						} catch (_e) {
							return [];
						}
						return [
							{
								parser_state: parser.save(),
								inputs: prediction.inputs.concat({ type: 'string', value }),
								completed: parser.results.length !== 0
							} satisfies _Prediction
						];
					}
					// If symbol is everything it can only means we're inside a ref
					if (typeof symbol === 'string' && symbol.endsWith('#EVERYTHING')) {
						const reference_rule = state.rule;
						const reference = reference_rule.name.substring(
							reference_rule.name.indexOf('#REF') + '#REF'.length
						);
						parser.restore(prediction.parser_state);
						parser.feed([{ type: 'stop_everything' }]);
						return [
							{
								parser_state: parser.save(),
								inputs: prediction.inputs.concat({ type: 'reference', value: reference }),
								completed: parser.results.length !== 0
							} satisfies _Prediction
						];
					}

					// Skip rules which create arbitrary long inputs
					if (state.rule.name.endsWith('#EVERYTHING')) return [];

					return [];
				});
		});

		// Concat text inputs
		predictions = predictions.map((prediction) => ({
			...prediction,
			inputs: prediction.inputs.reduce((a: InputPrediction, b) => {
				if (a.length === 0) return [b];
				if (a[a.length - 1].type === 'string' && b.type == 'string')
					return [
						...a.slice(0, a.length - 1),
						{ type: 'string', value: (a[a.length - 1].value + b.value).replaceAll(/[ \t]+/g, ' ') }
					];
				return [...a, b];
			}, [])
		}));

		// Filter for duplicates
		predictions = remove_duplicates_prediction(predictions);
	}

	if (predictions.length === 0) {
		parser.restore(origin);
		return parser.results.length === 0 ? undefined : [];
	}

	return predictions
		.map((v) => v.inputs)
		.filter((v) => !(v.length === 1 && v[0].type === 'string' && v[0].value === ' '));
}
