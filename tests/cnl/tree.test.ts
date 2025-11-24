import { fromTextualToTree, type CnlRoot } from '$lib/cnl/tree';
import { expect, test, it } from 'vitest';

test('One Line', () => {
	const value = 'Ligne';

	expect(fromTextualToTree(value)).deep.equal({
		type: 'root',
		value: {
			type: 'content',
			value: [{ type: 'paragraph', line: { type: 'line', value: 'Ligne' } }]
		}
	} satisfies CnlRoot);
});

test('0 - Level', () => {
	const value = 'Ligne1\nLigne2\nLigne3\nLigne4';

	expect(fromTextualToTree(value)).deep.equal({
		type: 'root',
		value: {
			type: 'content',
			value: [
				{ type: 'paragraph', line: { type: 'line', value: 'Ligne1' } },
				{ type: 'paragraph', line: { type: 'line', value: 'Ligne2' } },
				{ type: 'paragraph', line: { type: 'line', value: 'Ligne3' } },
				{ type: 'paragraph', line: { type: 'line', value: 'Ligne4' } }
			]
		}
	} satisfies CnlRoot);
});

test('1 - Level', () => {
	const value = 'Ligne1\n\tLigne1.1\nLigne2\n\tLigne2.1\nLigne3\n\tLigne3.1\nLigne4\n\tLigne4.1';

	expect(fromTextualToTree(value)).deep.equal({
		type: 'root',
		value: {
			type: 'content',
			value: [
				{
					type: 'paragraph',
					line: { type: 'line', value: 'Ligne1' },
					content: {
						type: 'content',
						value: [{ type: 'paragraph', line: { type: 'line', value: 'Ligne1.1' } }]
					}
				},

				{
					type: 'paragraph',
					line: { type: 'line', value: 'Ligne2' },
					content: {
						type: 'content',
						value: [{ type: 'paragraph', line: { type: 'line', value: 'Ligne2.1' } }]
					}
				},
				{
					type: 'paragraph',
					line: { type: 'line', value: 'Ligne3' },
					content: {
						type: 'content',
						value: [{ type: 'paragraph', line: { type: 'line', value: 'Ligne3.1' } }]
					}
				},
				{
					type: 'paragraph',
					line: { type: 'line', value: 'Ligne4' },
					content: {
						type: 'content',
						value: [{ type: 'paragraph', line: { type: 'line', value: 'Ligne4.1' } }]
					}
				}
			]
		}
	} satisfies CnlRoot);
});

test('1 - Level multiple', () => {
	const value =
		'Ligne1\n\tLigne1.1\n\tLigne1.2\n\tLigne1.3\nLigne2\n\tLigne2.1\n\tLigne2.2\n\tLigne2.3\nLigne3\n\tLigne3.1\n\tLigne3.2\n\tLigne3.3\nLigne4\n\tLigne4.1\n\tLigne4.2\n\tLigne4.3';

	expect(fromTextualToTree(value)).deep.equal({
		type: 'root',
		value: {
			type: 'content',
			value: [
				{
					type: 'paragraph',
					line: { type: 'line', value: 'Ligne1' },
					content: {
						type: 'content',
						value: [
							{ type: 'paragraph', line: { type: 'line', value: 'Ligne1.1' } },
							{ type: 'paragraph', line: { type: 'line', value: 'Ligne1.2' } },
							{ type: 'paragraph', line: { type: 'line', value: 'Ligne1.3' } }
						]
					}
				},

				{
					type: 'paragraph',
					line: { type: 'line', value: 'Ligne2' },
					content: {
						type: 'content',
						value: [
							{ type: 'paragraph', line: { type: 'line', value: 'Ligne2.1' } },
							{ type: 'paragraph', line: { type: 'line', value: 'Ligne2.2' } },
							{ type: 'paragraph', line: { type: 'line', value: 'Ligne2.3' } }
						]
					}
				},
				{
					type: 'paragraph',
					line: { type: 'line', value: 'Ligne3' },
					content: {
						type: 'content',
						value: [
							{ type: 'paragraph', line: { type: 'line', value: 'Ligne3.1' } },
							{ type: 'paragraph', line: { type: 'line', value: 'Ligne3.2' } },
							{ type: 'paragraph', line: { type: 'line', value: 'Ligne3.3' } }
						]
					}
				},
				{
					type: 'paragraph',
					line: { type: 'line', value: 'Ligne4' },
					content: {
						type: 'content',
						value: [
							{ type: 'paragraph', line: { type: 'line', value: 'Ligne4.1' } },
							{ type: 'paragraph', line: { type: 'line', value: 'Ligne4.2' } },
							{ type: 'paragraph', line: { type: 'line', value: 'Ligne4.3' } }
						]
					}
				}
			]
		}
	} satisfies CnlRoot);
});

test('2 - Level', () => {
	const value = 'Ligne1\n\tLigne1.1\n\tLigne1.2\n\tLigne1.3\n\t\tLigne1.3.1\n\t\tLigne1.3.2';

	expect(fromTextualToTree(value)).deep.equal({
		type: 'root',
		value: {
			type: 'content',
			value: [
				{
					type: 'paragraph',
					line: { type: 'line', value: 'Ligne1' },
					content: {
						type: 'content',
						value: [
							{ type: 'paragraph', line: { type: 'line', value: 'Ligne1.1' } },
							{ type: 'paragraph', line: { type: 'line', value: 'Ligne1.2' } },
							{
								type: 'paragraph',
								line: { type: 'line', value: 'Ligne1.3' },
								content: {
									type: 'content',
									value: [
										{ type: 'paragraph', line: { type: 'line', value: 'Ligne1.3.1' } },
										{ type: 'paragraph', line: { type: 'line', value: 'Ligne1.3.2' } }
									]
								}
							}
						]
					}
				}
			]
		}
	} satisfies CnlRoot);
});
