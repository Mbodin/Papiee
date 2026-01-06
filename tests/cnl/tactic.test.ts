import { newCnlParser as _newCnlParser, type CnlParser } from '$lib/cnl/chunks/parser';
import { createTacticFromTextual, type CnlParsingState, type CnlTactic } from '$lib/cnl/cnl_tactic';
import { fromTextualToTree } from '$lib/cnl/tree';
import { expect, test } from 'vitest';

function newCnlParser(tactics: CnlTactic[], initial_state: CnlParsingState): CnlParser {
	const parser = _newCnlParser(tactics, initial_state);
	return (root) =>
		parser(root).map((v: any) => {
			if (v.type === 'parsed' && v.tactic && v.tactic.textual) {
				const textual = v.tactic.textual;
				delete v.tactic;
				v['textual'] = textual;
				return v;
			}
			return v;
		});
}

test('Line - One text tactic', () => {
	const value = 'Hello World !';

	const parser = newCnlParser(
		[createTacticFromTextual(undefined, '{|Hello World !|}', () => '')],
		[]
	);

	expect(parser(fromTextualToTree(value))).deep.equal([
		{
			value: {},
			range: { parent: [0, 0], startOffset: 0, endOffset: 13 },
			code: '',
			type: 'parsed',
			textual: '{|Hello World !|}'
		}
	]);
});

test('Line - Multiple text tactics', () => {
	const value = 'Hello World !Hello World !Hello World !';

	const parser = newCnlParser(
		[createTacticFromTextual(undefined, '{|Hello World !|}', () => '')],
		[]
	);

	expect(parser(fromTextualToTree(value))).deep.equal([
		{
			value: {},
			range: { parent: [0, 0], startOffset: 0, endOffset: 13 },
			code: '',
			type: 'parsed',
			textual: '{|Hello World !|}'
		},
		{
			value: {},
			range: { parent: [0, 0], startOffset: 13, endOffset: 26 },
			code: '',
			type: 'parsed',
			textual: '{|Hello World !|}'
		},
		{
			value: {},
			range: { parent: [0, 0], startOffset: 26, endOffset: 39 },
			code: '',
			type: 'parsed',
			textual: '{|Hello World !|}'
		}
	]);
});

test('Line - Multiple text tactics (arbitrary spaces)', () => {
	const value =
		'Hello World !      Hello World !                                        Hello World !';

	const parser = newCnlParser(
		[createTacticFromTextual(undefined, '{|Hello World !|}', () => '')],
		[]
	);

	expect(parser(fromTextualToTree(value))).deep.equal([
		{
			value: {},
			range: { parent: [0, 0], startOffset: 0, endOffset: 13 },
			code: '',
			type: 'parsed',
			textual: '{|Hello World !|}'
		},
		{
			value: {},
			range: { parent: [0, 0], startOffset: 13, endOffset: 32 },
			code: '',
			type: 'parsed',
			textual: '{|Hello World !|}'
		},
		{
			value: {},
			range: { parent: [0, 0], startOffset: 32, endOffset: 85 },
			code: '',
			type: 'parsed',
			textual: '{|Hello World !|}'
		}
	]);
});

test('Line - Text tactics (+ state)', () => {
	const value = 'Hello World0 !Hello World1 !Hello World2 !';

	const parser = newCnlParser(
		[
			createTacticFromTextual(undefined, '{0|Hello World0 !|-+1}', () => ''),
			createTacticFromTextual(undefined, '{1|Hello World1 !|-+2}', () => ''),
			createTacticFromTextual(undefined, '{2|Hello World2 !|-}', () => '')
		],
		['0']
	);

	expect(parser(fromTextualToTree(value))).deep.equal([
		{
			value: {},
			range: { parent: [0, 0], startOffset: 0, endOffset: 14 },
			code: '',
			type: 'parsed',
			textual: '{0|Hello World0 !|-+1}'
		},
		{
			value: {},
			range: { parent: [0, 0], startOffset: 14, endOffset: 28 },
			code: '',
			type: 'parsed',
			textual: '{1|Hello World1 !|-+2}'
		},
		{
			value: {},
			range: { parent: [0, 0], startOffset: 28, endOffset: 42 },
			code: '',
			type: 'parsed',
			textual: '{2|Hello World2 !|-}'
		}
	]);
});

test('Paragraph - Text tactics (+ state)', () => {
	const value = 'Hello World0 !\n\tHello World1 !\n\tHello World2 !';

	const parser = newCnlParser(
		[
			createTacticFromTextual(undefined, '{0|Hello World0 !|>-+1}', () => ''),
			createTacticFromTextual(undefined, '{1|Hello World1 !|-+2}', () => ''),
			createTacticFromTextual(undefined, '{2|Hello World2 !|<-}', () => '')
		],
		['0']
	);

	expect(parser(fromTextualToTree(value))).deep.equal([
		{
			value: {},
			range: { parent: [0, 0], startOffset: 0, endOffset: 14 },
			code: '',
			type: 'parsed',
			textual: '{0|Hello World0 !|>-+1}'
		},
		{
			value: {},
			range: { parent: [0, 1, 0, 0], startOffset: 0, endOffset: 14 },
			code: '',
			type: 'parsed',
			textual: '{1|Hello World1 !|-+2}'
		},
		{
			value: {},
			range: { parent: [0, 1, 1, 0], startOffset: 0, endOffset: 14 },
			code: '',
			type: 'parsed',
			textual: '{2|Hello World2 !|<-}'
		}
	]);
});

test('Paragraph - Text tactics (+ state) + Structure Error', () => {
	const value = 'Hello World0 !\n\tHello World1 !\nHello World2 !';

	const parser = newCnlParser(
		[
			createTacticFromTextual(undefined, '{0|Hello World0 !|>-+1}', () => ''),
			createTacticFromTextual(undefined, '{1|Hello World1 !|-+2}', () => ''),
			createTacticFromTextual(undefined, '{2|Hello World2 !|<-}', () => '')
		],
		['0']
	);

	expect(parser(fromTextualToTree(value))).deep.equal([
		{
			value: {},
			range: { parent: [0, 0], startOffset: 0, endOffset: 14 },
			code: '',
			type: 'parsed',
			textual: '{0|Hello World0 !|>-+1}'
		},
		{
			value: {},
			range: { parent: [0, 1, 0, 0], startOffset: 0, endOffset: 14 },
			code: '',
			type: 'parsed',
			textual: '{1|Hello World1 !|-+2}'
		},
		{
			fatal: 1,
			range: {
				endOffset: -1,
				parent: [0],
				startOffset: -1
			},
			type: 'error'
		},
		{
			fatal: 1,
			range: { parent: [1, 0], startOffset: 0, endOffset: 14 },
			type: 'error'
		}
	]);
});
