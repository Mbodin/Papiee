import type { CnlChunk, TacticChunk } from '$lib/cnl/chunks/types';
import {
	comparePosition,
	fromTextualToTree,
	type CnlContent,
	type CnlLine,
	type CnlParagraph,
	type CnlPosition,
	type CnlRoot
} from '$lib/cnl/tree';
import type { Node, ResolvedPos } from 'prosemirror-model';
import { schema } from './schema';
import type { ProofNodeValue } from './structure';
import { newCnlParser } from '$lib/cnl/chunks/parser';
import { getTactics } from '$lib/cnl/cnl_tactic';
import type { EditorState } from 'prosemirror-state';

export function fromSchemaToCnl(node: Node): { root: CnlRoot; chunks: CnlChunk[] } {
	if (node.type.name !== 'doc') {
		throw new Error('fromSchemaToCnl must be called with a doc node');
	}

	const chunks: CnlChunk[] = [];

	function fromSchemaContentToCnlContent(node: Node): CnlContent {
		if (node.type.name !== schema.nodes.content.name) {
			throw new Error('fromSchemaContentToCnlContent must be called with a content node');
		}
		return {
			type: 'content',
			value: node.children.map((v) => fromSchemaParagraphToCnlParagraph(v))
		};
	}

	function fromSchemaParagraphToCnlParagraph(node: Node): CnlParagraph {
		if (node.type.name !== schema.nodes.paragraph.name) {
			throw new Error('fromSchemaParagraphToCnlParagraph must be called with a paragraph node');
		}

		const [line, content] = node.children;

		return {
			type: 'paragraph',
			line: fromSchemaLineToCnlLine(line),
			content: content ? fromSchemaContentToCnlContent(content) : undefined
		};
	}

	function fromSchemaLineToCnlLine(node: Node): CnlLine {
		if (node.type.name !== schema.nodes.line.name) {
			throw new Error('fromSchemaLineToCnlLine must be called with a line node');
		}

		const value = node.children
			.map((chunk) => chunk.children.map((v) => fromSchemaInlineToString(v)))
			.flat()
			.join('');

		chunks.push(
			...node.children
				.map((v) => {
					const node_chunks = v.attrs.value as CnlChunk[] | undefined;
					return node_chunks || [];
				})
				.flat()
		);

		return { type: 'line', value };
	}

	return {
		root: {
			type: 'root',
			value: fromSchemaContentToCnlContent(node.child(0))
		},
		chunks
	};
}

function fromSchemaInlineToString(node: Node): string {
	if (node.type.name === schema.nodes.text.name) return node.textContent;
	if (node.type.name === schema.nodes.math.name) return `$${node.textContent}$`;
	return '';
}

export function fromCnlToSchema(root: CnlRoot, chunks: CnlChunk[]) {
	function fromCnlContentToSchema(position: CnlPosition, content: CnlContent): Node {
		return schema.nodes.content.create(
			undefined,
			content.value.map((paragraph, i) => fromCnlParagraphToSchema(position.concat(i), paragraph))
		);
	}

	function fromCnlParagraphToSchema(position: CnlPosition, paragraph: CnlParagraph): Node {
		const line = fromCnlLineToSchema(position.concat(0), paragraph.line);
		if (!paragraph.content) {
			return schema.nodes.paragraph.create(undefined, line);
		} else {
			const content = fromCnlContentToSchema(position.concat(1), paragraph.content);
			return schema.nodes.paragraph.create(undefined, [line, content]);
		}
	}

	function fromCnlLineToSchema(position: CnlPosition, line: CnlLine): Node {
		const text = line.value;

		let line_chunks = chunks.filter((v) => comparePosition(v.range.parent, position) === 0);
		if (line_chunks.length === 0) {
			line_chunks.push({
				type: 'comment',
				range: { parent: position, startOffset: 0, endOffset: text.length },
				comment_code: ''
			} as unknown as TacticChunk);
		}
		let index = 0;
		line_chunks.sort((a, b) => a.range.startOffset - b.range.startOffset);

		return schema.nodes.line.create(
			undefined,
			line_chunks.map((chunk) => {
				if (chunk.range.startOffset !== index) {
					throw new Error('Chunk is not started at the end of the previous one');
				}

				index = chunk.range.endOffset;

				return schema.nodes.chunk.create(
					{ value: [chunk] },
					fromCnlLineTextToSchema(text.substring(chunk.range.startOffset, chunk.range.endOffset))
				);
			})
		);
	}

	function fromCnlLineTextToSchema(value: string): Node | Node[] | undefined {
		if (value.length === 0) return undefined;
		const nodes = [];
		const regex = /\$(.*?)\$|([^$]+)/gs;
		let match;
		while ((match = regex.exec(value))) {
			if (match[1]) {
				nodes.push(
					schema.nodes.math.create(
						undefined,
						match[1].length !== 0 ? schema.text(match[1]) : undefined
					)
				);
			} else if (match[2]) {
				nodes.push(schema.text(match[2]));
			}
		}
		return nodes;
	}

	return schema.nodes.doc.create(undefined, fromCnlContentToSchema([], root.value));
}

export function fromProofNodeToRocq(value: ProofNodeValue) {
	const chunks = newCnlParser(getTactics(), value.initial_state)(fromTextualToTree(value.value));

	return chunks
		.map((v) => {
			switch (v.type) {
				case 'error':
					return '';
				case 'comment':
					return v.comment_code;
				case 'tactic':
					return v.code;
			}
		})
		.join('');
}

function getInlinePosition(position: ResolvedPos): number {
	const type = position.node().type.name;

	if (position.pos === 0) return 0;

	if (position.parentOffset === 0 && type === schema.nodes.line.name) return 0;

	return (
		(type === schema.nodes.math.name ? 1 : 0) +
		(type === schema.nodes.chunk.name || type === schema.nodes.math.name
			? position.parentOffset
			: 0) +
		getInlinePosition(position.$decrement(position.parentOffset + 1))
	);
}

function getSchemaPosition($p: ResolvedPos, value: number): ResolvedPos {
	const type = $p.node().type.name;
	if (value === 0) return $p;

	if (type === schema.nodes.line.name) {
		if ($p.pos === $p.$end().pos) return $p; // We can't exit the line
		// Either start of line, or just before start of chunks : in both case there is no character so we increment the position alone
		return getSchemaPosition($p.$increment(), value);
	} else if (type === schema.nodes.chunk.name) {
		const size = $p.node().content.size;
		const diff = Math.min(size, value);

		$p = $p.$start();
		if (value > size) {
			return getSchemaPosition($p.$after(), value - diff);
		}
		return getSchemaPosition($p.$increment(diff), 0);
	} else if (type === schema.nodes.math.name) {
		throw new Error('Should not happen (math node)');
	}
	throw new Error('Should not happen (generic)');
}

export function getNewSelectionPosition(
	previous_state: EditorState,
	previous_head: ResolvedPos,
	current_doc: Node
): ResolvedPos {
	let line_level = previous_head.node().type.name === schema.nodes.math.name ? -2 : -1;
	const $line_begin = previous_head.$posAtIndex(0, line_level);

	const $new_line_begin = current_doc.resolve($line_begin.pos);
	const new_head = getSchemaPosition($new_line_begin, getInlinePosition(previous_head));

	return new_head;
}
