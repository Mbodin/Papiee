import { fromTreeToTextual, fromTextualToTree, type CnlRoot } from '$lib/cnl/tree';
import { expect, test, it } from 'vitest';

test('One Line', () => {
	const value = 'Ligne';

	expect(fromTreeToTextual(fromTextualToTree(value))).equal(value);
});

test('0 - Level', () => {
	const value = 'Ligne1\nLigne2\nLigne3\nLigne4';

	expect(fromTreeToTextual(fromTextualToTree(value))).equal(value);
});

test('1 - Level', () => {
	const value = 'Ligne1\n\tLigne1.1\nLigne2\n\tLigne2.1\nLigne3\n\tLigne3.1\nLigne4\n\tLigne4.1';

	expect(fromTreeToTextual(fromTextualToTree(value))).equal(value);
});

test('1 - Level multiple', () => {
	const value =
		'Ligne1\n\tLigne1.1\n\tLigne1.2\n\tLigne1.3\nLigne2\n\tLigne2.1\n\tLigne2.2\n\tLigne2.3\nLigne3\n\tLigne3.1\n\tLigne3.2\n\tLigne3.3\nLigne4\n\tLigne4.1\n\tLigne4.2\n\tLigne4.3';

	expect(fromTreeToTextual(fromTextualToTree(value))).equal(value);
});

test('2 - Level', () => {
	const value = 'Ligne1\n\tLigne1.1\n\tLigne1.2\n\tLigne1.3\n\t\tLigne1.3.1\n\t\tLigne1.3.2';

	expect(fromTreeToTextual(fromTextualToTree(value))).equal(value);
});
