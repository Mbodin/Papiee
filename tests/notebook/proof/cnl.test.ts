import { newCnlParser as _newCnlParser, type CnlParser } from '$lib/cnl/chunks/parser';
import { createTacticFromTextual, type CnlParsingState, type CnlTactic } from '$lib/cnl/cnl_tactic';
import { fromTextualToTree } from '$lib/cnl/tree';
import { fromCnlToSchema } from '$lib/notebook/nodes/proof/cnl';
import { expect, test } from 'vitest';

function newCnlParser(tactics: CnlTactic[], initial_state: CnlParsingState): CnlParser {
	const parser = _newCnlParser(tactics, initial_state);
	return (root) =>
		parser(root).map((v: any) => {
			if (v.type === 'tactic' && v.tactic && v.tactic.textual) {
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

	const tree = fromTextualToTree(value);
	const chunks = parser(tree);
	const doc = fromCnlToSchema(tree, chunks);

	expect(JSON.parse(JSON.stringify(doc, undefined, 1))).deep.equal({
		type: 'doc',
		content: [
			{
				type: 'content',
				content: [
					{
						type: 'paragraph',
						content: [
							{
								type: 'line',
								content: [
									{
										type: 'chunk',
										attrs: {
											value: [
												{
													value: {},
													range: {
														parent: [0, 0],
														startOffset: 0,
														endOffset: 13
													},
													code: '',
													type: 'tactic',
													textual: '{|Hello World !|}'
												}
											]
										},
										content: [
											{
												type: 'text',
												text: 'Hello World !'
											}
										]
									}
								]
							}
						]
					}
				]
			}
		]
	});
});

test('Line - Multiple text tactics', () => {
	const value = 'Hello World !Hello World !Hello World !';

	const parser = newCnlParser(
		[createTacticFromTextual(undefined, '{|Hello World !|}', () => '')],
		[]
	);

	const tree = fromTextualToTree(value);
	const chunks = parser(tree);
	const doc = fromCnlToSchema(tree, chunks);

	expect(JSON.parse(JSON.stringify(doc, undefined, 1))).deep.equal({
		type: 'doc',
		content: [
			{
				type: 'content',
				content: [
					{
						type: 'paragraph',
						content: [
							{
								type: 'line',
								content: [
									{
										type: 'chunk',
										attrs: {
											value: [
												{
													value: {},
													range: {
														parent: [0, 0],
														startOffset: 0,
														endOffset: 13
													},
													code: '',
													type: 'tactic',
													textual: '{|Hello World !|}'
												}
											]
										},
										content: [
											{
												type: 'text',
												text: 'Hello World !'
											}
										]
									},
									{
										type: 'chunk',
										attrs: {
											value: [
												{
													value: {},
													range: {
														parent: [0, 0],
														startOffset: 13,
														endOffset: 26
													},
													code: '',
													type: 'tactic',
													textual: '{|Hello World !|}'
												}
											]
										},
										content: [
											{
												type: 'text',
												text: 'Hello World !'
											}
										]
									},
									{
										type: 'chunk',
										attrs: {
											value: [
												{
													value: {},
													range: {
														parent: [0, 0],
														startOffset: 26,
														endOffset: 39
													},
													code: '',
													type: 'tactic',
													textual: '{|Hello World !|}'
												}
											]
										},
										content: [
											{
												type: 'text',
												text: 'Hello World !'
											}
										]
									}
								]
							}
						]
					}
				]
			}
		]
	});
});

test('Line - Multiple text tactics (arbitrary spaces)', () => {
	const value =
		'Hello World !      Hello World !                                        Hello World !';

	const parser = newCnlParser(
		[createTacticFromTextual(undefined, '{|Hello World !|}', () => '')],
		[]
	);

	const tree = fromTextualToTree(value);
	const chunks = parser(tree);
	const doc = fromCnlToSchema(tree, chunks);

	expect(JSON.parse(JSON.stringify(doc, undefined, 1))).deep.equal({
		type: 'doc',
		content: [
			{
				type: 'content',
				content: [
					{
						type: 'paragraph',
						content: [
							{
								type: 'line',
								content: [
									{
										type: 'chunk',
										attrs: {
											value: [chunks[0]]
										},
										content: [
											{
												type: 'text',
												text: 'Hello World !'
											}
										]
									},
									{
										type: 'chunk',
										attrs: {
											value: [chunks[1]]
										},
										content: [
											{
												type: 'text',
												text: '      Hello World !'
											}
										]
									},
									{
										type: 'chunk',
										attrs: {
											value: [chunks[2]]
										},
										content: [
											{
												type: 'text',
												text: '                                        Hello World !'
											}
										]
									}
								]
							}
						]
					}
				]
			}
		]
	});
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

	const tree = fromTextualToTree(value);
	const chunks = parser(tree);
	const doc = fromCnlToSchema(tree, chunks);

	expect(JSON.parse(JSON.stringify(doc, undefined, 1))).deep.equal({
		type: 'doc',
		content: [
			{
				type: 'content',
				content: [
					{
						type: 'paragraph',
						content: [
							{
								type: 'line',
								content: [
									{
										type: 'chunk',
										attrs: {
											value: [chunks[0]]
										},
										content: [
											{
												type: 'text',
												text: 'Hello World0 !'
											}
										]
									},
									{
										type: 'chunk',
										attrs: {
											value: [chunks[1]]
										},
										content: [
											{
												type: 'text',
												text: 'Hello World1 !'
											}
										]
									},
									{
										type: 'chunk',
										attrs: {
											value: [chunks[2]]
										},
										content: [
											{
												type: 'text',
												text: 'Hello World2 !'
											}
										]
									}
								]
							}
						]
					}
				]
			}
		]
	});
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

	const tree = fromTextualToTree(value);
	const chunks = parser(tree);
	const doc = fromCnlToSchema(tree, chunks);

	expect(JSON.parse(JSON.stringify(doc, undefined, 1))).deep.equal({
		type: 'doc',
		content: [
			{
				type: 'content',
				content: [
					{
						type: 'paragraph',
						content: [
							{
								type: 'line',
								content: [
									{
										type: 'chunk',
										attrs: {
											value: [chunks[0]]
										},
										content: [
											{
												type: 'text',
												text: 'Hello World0 !'
											}
										]
									}
								]
							},
							{
								type: 'content',
								content: [
									{
										type: 'paragraph',
										content: [
											{
												type: 'line',
												content: [
													{
														type: 'chunk',
														attrs: {
															value: [chunks[1]]
														},
														content: [
															{
																type: 'text',
																text: 'Hello World1 !'
															}
														]
													}
												]
											}
										]
									},
									{
										type: 'paragraph',
										content: [
											{
												type: 'line',
												content: [
													{
														type: 'chunk',
														attrs: {
															value: [chunks[2]]
														},
														content: [
															{
																type: 'text',
																text: 'Hello World2 !'
															}
														]
													}
												]
											}
										]
									}
								]
							}
						]
					}
				]
			}
		]
	});
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

	const tree = fromTextualToTree(value);
	const chunks = parser(tree);
	const doc = fromCnlToSchema(tree, chunks);

	expect(JSON.parse(JSON.stringify(doc, undefined, 1))).deep.equal({
		type: 'doc',
		content: [
			{
				type: 'content',
				content: [
					{
						type: 'paragraph',
						content: [
							{
								type: 'line',
								content: [
									{
										type: 'chunk',
										attrs: {
											value: [chunks[0]]
										},
										content: [
											{
												type: 'text',
												text: 'Hello World0 !'
											}
										]
									}
								]
							},
							{
								type: 'content',
								content: [
									{
										type: 'paragraph',
										content: [
											{
												type: 'line',
												content: [
													{
														type: 'chunk',
														attrs: {
															value: [chunks[1]]
														},
														content: [
															{
																type: 'text',
																text: 'Hello World1 !'
															}
														]
													}
												]
											}
										]
									}
								]
							}
						]
					},
					{
						type: 'paragraph',
						content: [
							{
								type: 'line',
								content: [
									{
										type: 'chunk',
										attrs: {
											value: [chunks[3]]
										},
										content: [
											{
												type: 'text',
												text: 'Hello World2 !'
											}
										]
									}
								]
							}
						]
					}
				]
			}
		]
	});
});
