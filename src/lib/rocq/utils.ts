import { newCnlParser } from '$lib/cnl/chunks/parser';
import type { CnlChunk } from '$lib/cnl/chunks/types';
import { getTactics } from '$lib/cnl/cnl_tactic';
import { fromTextualToTree } from '$lib/cnl/tree';
import { fromCnlToSchema, fromProofNodeToRocq } from '$lib/notebook/nodes/proof/cnl';
import type { ProofNodeValue } from '$lib/notebook/nodes/proof/structure';
import type { RocqEndProofState, RocqNodeValue } from '$lib/notebook/nodes/rocq/structure';
import type { NotebookState } from '$lib/notebook/structure';
import { comparePosition, visit } from '$lib/notebook/utils';
import type { Position } from 'vscode-languageserver-protocol';
import * as proto from 'vscode-languageserver-protocol';
import * as types from 'vscode-languageserver-types';

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

export function getCodeRocqProofStatePosition(root: NotebookState, position: number[]) {
	let value: RocqEndProofState | undefined = undefined;
	visit(root, (_node, pos) => {
		if (comparePosition(pos, position) != 1) return;
		if (_node.type === 'proof') {
			value = undefined;
		}
		if (_node.type === 'rocq') {
			const node = _node as RocqNodeValue;
			value = node.proof_state;
		}
	});
	return value;
}

export function getCodeBeforePosition(root: NotebookState, position: number[]) {
	let before = '';
	visit(root, (_node, pos) => {
		if (comparePosition(pos, position) != 1) return;
		if (_node.type === 'proof') {
			const node = _node as ProofNodeValue;
			before += fromProofNodeToRocq(node) + 'admitted. Qed. ';
		}
		if (_node.type === 'rocq') {
			const node = _node as RocqNodeValue;
			before += node.value.trim() + '\n' + (node.proof_state === 'accessible' ? 'Proof. ' : '');
		}
	});
	return before;
}

export function assembleCodeFromChunks(
	root: NotebookState,
	chunks: CnlChunk[],
	position: number,
	node_position: number[]
): string {
	const code = chunks
		.slice(0, position + 1)
		.filter((v) => v.type === 'tactic')
		.map((v) => v.code)
		.join('');

	let before = getCodeBeforePosition(root, node_position);
	let text = before + code;
	return text;
}

export async function extractRocqEndProofState(
	connection: proto.MessageConnection,
	code: string
): Promise<RocqEndProofState> {
	let uri = 'file:///exercise/main.v';
	let languageId = 'rocq';
	let version = 1;

	let textDocument = types.TextDocumentItem.create(uri, languageId, version, code);
	let openParams: proto.DidOpenTextDocumentParams = { textDocument };
	await connection.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams);
	const return_value: any = await connection.sendRequest('coq/getDocument', {
		textDocument,
		goals: 'Str',
		ast: true
	});

	let o = return_value?.spans?.[return_value.spans.length - 2]?.ast?.v?.expr?.[1]?.[0];

	if (o == null) return 'nothing';
	else if (o === 'VernacProof' || o === 'VernacExtend') return 'open';
	else if (o === 'VernacStartTheoremProof') return 'accessible';
	else return 'nothing';
}
