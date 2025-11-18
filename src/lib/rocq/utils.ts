import { cnltoRocq, type ProofChunk } from '$lib/notebook/nodes/proof/chunk';
import type { ProofNodeValue } from '$lib/notebook/nodes/proof/structure';
import type { RocqNodeValue } from '$lib/notebook/nodes/rocq/structure';
import type { NotebookState } from '$lib/notebook/structure';
import { comparePosition, visit } from '$lib/notebook/utils';
import type { Position } from 'vscode-languageserver-protocol';

export function positionAfterString(value: string): Position {
	const line_number = value.includes('\n') ? value.split('\n').length - 1 : 0;
	const last_line = value.includes('\n') ? value.substring(value.lastIndexOf('\n') + 1) : value;
	return {
		line: line_number,
		character: last_line.length
	};
}

export function addPosition(pos1: Position, pos2: Position): Position {
	if (pos2.line === 0) return { line: pos1.line, character: pos1.character + pos1.character };
	return {
		line: pos1.line + pos2.line,
		character: pos2.character
	};
}

export function assembleCodeFromChunks(
	root: NotebookState,
	chunks: ProofChunk[],
	position: number,
	node_position: number[]
): string {
	const code = chunks
		.slice(0, position + 1)
		.filter((v) => v.type === 'tactic')
		.map((v) => v.code)
		.join('');

	let before = '';
	visit(root, (node, pos) => {
		if (comparePosition(pos, node_position) != 1) return;
		if (node.type === 'proof') {
			before += cnltoRocq((node as ProofNodeValue).value);
		}
		if (node.type === 'rocq') {
			before += (node as RocqNodeValue).value.trim() + '\n';
		}
	});
	let before_position = positionAfterString(before);
	let text = before + code;
	return text;
}
