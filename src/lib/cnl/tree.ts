import { ParseError } from '$lib/parsing';

export type CnlRoot = { type: 'root'; value: CnlContent };
export type CnlContent = { type: 'content'; value: CnlParagraph[] };

export type CnlParagraph = {
	type: 'paragraph';
	line: CnlLine;
	content?: CnlContent;
};

export type CnlLine = { type: 'line'; value: string };

export type CnlPosition = number[];

/**
 * A cnl file is a text file where :
 * - First line of paragraph must start with \t
 * - Indent of paragraphs is represented by a number of \t
 * Example valid text:
 * \t1 Paragraph
 * \t2 Paragraph
 * \t\t2.1 Paragraph
 * \t\t2.2 Paragraph
 * @param value the string value to be parsed
 * @returns a cnl root
 */
export function parse(value: string): CnlRoot {
	const lines = value.includes('\n') ? value.split('\n') : [value];

	let index = 0;
	const paragraphs: CnlParagraph[] = [];

	while (index < lines.length) {
		const { node, next } = parseParagraph(lines, 0, index);
		index = next;
		paragraphs.push(node);
	}

	return { type: 'root', value: { type: 'content', value: paragraphs } };
}

/**
 * Recursively parses a paragraph and its children.
 * @param lines the lines to be considered
 * @param level the current indentation level
 * @param startIndex the fist line of the paragraph definition (initially 0)
 * @returns a cnl paragraph
 */
function parseParagraph(
	lines: string[],
	level: number,
	startIndex: number
): { node: CnlParagraph; next: number } {
	// Extract first line (must start with \t)
	const line: CnlLine = parseLine(lines[startIndex].substring(level));
	// Get current paragraph indentation level
	const currentIndent = getIndentationLevel(lines[startIndex]);

	const content_value: CnlParagraph[] = [];
	let i = startIndex + 1; // First line contains paragraph line value

	if (currentIndent < level) throw new ParseError(`Unexpected dedent at line ${i + 1}`);
	if (currentIndent > level) throw new ParseError(`Unexpected extra indentation at line ${i + 1}`);

	// Accumulate continuation lines (same or greater indentation)
	while (i < lines.length) {
		const indent = getIndentationLevel(lines[i]);

		if (indent === level) {
			// Next paragraph at same level → stop
			break;
		}

		if (indent === level + 1) {
			// Child paragraph → parse recursively
			const { node: child, next } = parseParagraph(lines, level + 1, i);
			content_value.push(child);
			i = next;
			continue;
		} else if (indent < level) {
			// Dedent → stop
			break;
		} else {
			throw new ParseError(
				`Invalid indentation at line ${i + 1}: got ${indent}, expected ≤ ${level + 1}`
			);
		}
	}

	if (content_value.length === 0) {
		return { node: { type: 'paragraph', line }, next: i };
	}

	return {
		node: {
			type: 'paragraph',
			line,
			content: { type: 'content', value: content_value }
		},
		next: i
	};
}

/**
 * Parse a line
 * @param value
 * @returns a cnl line
 */
function parseLine(value: string): CnlLine {
	return { type: 'line', value: value.replaceAll(/\u00A0/g, ' ') };
}

/**
 * Counts the number of leading tab characters in a string.
 * @param line
 * @returns the indentation level
 */
function getIndentationLevel(line: string): number {
	let count = 0;
	for (const ch of line) {
		if (ch === '\t') count++;
		else break;
	}
	return count;
}
