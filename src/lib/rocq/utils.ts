import { Cache } from '$lib/cache';
import { newCnlParser } from '$lib/cnl/chunks/parser';
import type { CnlChunk } from '$lib/cnl/chunks/types';
import { getTactics } from '$lib/cnl/cnl_tactic';
import { fromTextualToTree } from '$lib/cnl/tree';
import { fromCnlToSchema, fromProofNodeToRocq } from '$lib/notebook/nodes/proof/cnl';
import type { ProofNodeState, ProofNodeValue } from '$lib/notebook/nodes/proof/structure';
import type { RocqEndProofState, RocqNodeValue } from '$lib/notebook/nodes/rocq/structure';
import type { NotebookState } from '$lib/notebook/structure';
import { comparePosition, visit } from '$lib/notebook/utils';
import type { Position } from 'vscode-languageserver-protocol';
import * as proto from 'vscode-languageserver-protocol';
import * as types from 'vscode-languageserver-types';
import { getRocqFileHeaderContent } from './connection';

export function new_file_name(prefix: string) {
	return (prefix === '' ? '_' : prefix) + crypto.randomUUID().replaceAll('-', '_') + '.v';
}

export function positionAfterString(value: string): Position {
	const line_number = value.includes('\n') ? value.split('\n').length - 1 : 0;
	const last_line = value.includes('\n') ? value.substring(value.lastIndexOf('\n') + 1) : value;
	return {
		line: line_number,
		character: last_line.length
	};
}

export function fromPositionToIndex(value: string, pos: Position): number {
	if (!value.includes('\n')) {
		if (pos.line > 0) return value.length;
		return Math.min(pos.character, value.length);
	}

	const lines = value.split('\n');
	if (pos.line >= lines.length) return value.length;

	const character = Math.min(value[pos.line].length, pos.character);
	return lines.slice(0, pos.line).concat(lines[pos.line].substring(0, character)).join('\n').length;
}

export function addPosition(pos1: Position, pos2: Position): Position {
	if (pos2.line === 0) return { line: pos1.line, character: pos1.character + pos1.character };
	return {
		line: pos1.line + pos2.line,
		character: pos2.character
	};
}

export function minPosition(pos1: Position, pos2: Position): Position {
	if (pos2.line > pos1.line) return pos1;
	if (pos2.line === pos1.line) return pos1.character > pos2.character ? pos2 : pos1;
	return pos2;
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
	let before = getRocqFileHeaderContent();
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
	let uri = 'file:///exercise/' + new_file_name('extract_rocq_');
	let languageId = 'rocq';
	let version = 1;
	let textDocument = types.TextDocumentItem.create(
		uri,
		languageId,
		version,
		code.replaceAll(/\u00A0/g, ' ')
	);

	let openParams: proto.DidOpenTextDocumentParams = { textDocument };
	await connection
		.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams)
		.catch(console.error);
	const return_value: any = await connection.sendRequest('coq/getDocument', {
		textDocument,
		goals: 'Str',
		ast: true
	});

	await connection
		.sendNotification(proto.DidDeleteFilesNotification.type, { files: [{ uri }] })
		.catch(console.error);

	let o = return_value?.spans?.[return_value.spans.length - 2]?.ast?.v?.expr?.[1]?.[0];
	if (o == null) return 'nothing';
	else if (o === 'VernacProof' || o === 'VernacExtend') return 'open';
	else if (o === 'VernacStartTheoremProof') return 'accessible';
	else return 'nothing';
}

const CACHE_extractRocqEndProofNodeState = new Cache<string, ProofNodeState>(128);

export async function extractRocqEndProofNodeState(
	connection: proto.MessageConnection,
	code: string
): Promise<ProofNodeState> {
	code = code.replaceAll(/\u00A0/g, ' ') + 'Qed.';

	const cached = CACHE_extractRocqEndProofNodeState.get(code);
	if (cached) return cached.value;

	let uri = 'file:///exercise/' + new_file_name('extract_rocq_');
	let languageId = 'rocq';
	let version = 1;
	let textDocument = types.TextDocumentItem.create(uri, languageId, version, code);

	let openParams: proto.DidOpenTextDocumentParams = { textDocument };
	await connection
		.sendNotification(proto.DidOpenTextDocumentNotification.type, openParams)
		.catch(console.error);
	const return_value: any = await connection.sendRequest('coq/getDocument', {
		textDocument,
		goals: 'Str',
		ast: true
	});

	await connection
		.sendNotification(proto.DidDeleteFilesNotification.type, { files: [{ uri }] })
		.catch(console.error);

	const errors = return_value.spans.filter((v: any) => 'error' in v.goals);
	if (errors.length > 1) {
		CACHE_extractRocqEndProofNodeState.set(code, 'error');
		return 'error';
	} else {
		try {
			let o = return_value?.spans?.[return_value.spans.length - 2]?.goals?.error;
			if (o[1][0][1].includes('Attempt to save an incomplete proof')) {
				CACHE_extractRocqEndProofNodeState.set(code, 'admit');
				return 'admit';
			}
		} catch (_e) {}

		CACHE_extractRocqEndProofNodeState.set(code, 'done');
		return 'done';
	}
}
