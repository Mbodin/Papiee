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

		const value = node.textContent;

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
					chunk.range.startOffset === chunk.range.endOffset
						? undefined
						: schema.text(text.substring(chunk.range.startOffset, chunk.range.endOffset))
				);
			})
		);
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

export function getNewSelectionPosition(
	previous_state: EditorState,
	previous_head: ResolvedPos,
	current_doc: Node
): ResolvedPos {
	const line = previous_head.$posAtIndex(0, -1);

	const nodes: string[] = [];
	previous_head.doc.nodesBetween(line.pos, previous_head.pos, (n) => {
		if (n.type.name === schema.nodes.chunk.name) nodes.push(n.textContent);
	});

	const real_text = nodes
		.map((v, i) => (i === previous_head.index(-1) ? v.substring(0, previous_head.parentOffset) : v))
		.join('');
	const real_text_offset = real_text.length;

	let current_text_offset = 0;
	let node = current_doc.resolve(line.pos).$increment(); // First chunk selected

	while (current_text_offset < real_text_offset) {
		const length = node.end() - node.start();
		current_text_offset += length;
		if (current_text_offset < real_text_offset) {
			const index = node.index(-1);
			node = node.$posAtIndex(index + 1, -1).$increment();
		} else {
			// real_text_offset <= curent_text_offset
			const i = real_text_offset - (current_text_offset - length);
			node = node.$(node.pos + i);
		}
	}

	return node;
}
