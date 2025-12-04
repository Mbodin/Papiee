import { Cache } from '$lib/cache';
import type { CnlChunk } from '$lib/cnl/chunks/types';
import { fromProofNodeToRocq } from '$lib/notebook/nodes/proof/cnl';
import type { ProofNodeState, ProofNodeValue } from '$lib/notebook/nodes/proof/structure';
import type { RocqEndProofState, RocqNodeValue } from '$lib/notebook/nodes/rocq/structure';
import type { NotebookState } from '$lib/notebook/structure';
import { comparePosition, visit } from '$lib/notebook/utils';
import {
	DocumentDiagnosticRequest,
	DocumentSymbolRequest,
	PublishDiagnosticsNotification,
	type Position
} from 'vscode-languageserver-protocol';
import { getRocqFileHeaderContent } from './connection';
import type { LspProofState, LspVariable, MessageConnection } from './type';
import type { GoalAnswer } from './pp';

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

	const character = Math.min(lines[pos.line].length, pos.character);
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

export async function lsp_getProofEndState(
	connection: MessageConnection,
	code: string
): Promise<RocqEndProofState> {
	return connection.transient_file(
		async ({ document }) => {
			let ast_spans: [string, [string, ...any]][] = await connection
				.sendRequest('coq/getDocument', {
					textDocument: document,
					goals: 'Str',
					ast: true
				})
				.then((v: any) => v.spans.filter((v: any) => 'ast' in v).map((v: any) => v.ast.v.expr));

			let last_endproof_i = ast_spans.findIndex(
				(v: any) => v[0] === 'VernacSynPure' && v[1][0] === 'VernacEndProof'
			);

			let after_last = ast_spans.slice(last_endproof_i + 1);

			let begin_i = ast_spans.findIndex((v: [string, [string, ...any]]) => {
				if (v[0] === 'VernacSynPure') {
					if (v[1][0] === 'VernacDefinition') return true;
					if (v[1][0] === 'VernacStartTheoremProof') return true;
				}

				return false;
			});

			let begin = ast_spans[begin_i];

			if (begin == null) return 'nothing';

			let opened = after_last.find((v) => v[0] === 'VernacSynPure' && v[1][0] === 'VernacProof');

			return opened ? 'open' : 'accessible';
		},
		{ text: code.replaceAll(/\u00A0/g, ' ') }
	);
}

const CACHE_extractRocqEndProofNodeState = new Cache<string, ProofNodeState>(128);

export async function lsp_getProofBeginState(
	connection: MessageConnection,
	code: string
): Promise<ProofNodeState> {
	code = code.replaceAll(/\u00A0/g, ' ') + 'Qed.';

	const cached = CACHE_extractRocqEndProofNodeState.get(code);
	if (cached) return cached.value;

	return connection.transient_file(
		async ({ document }) => {
			const return_value: any = await connection.sendRequest('coq/getDocument', {
				textDocument: document,
				goals: 'Str',
				ast: true
			});

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
		},
		{ text: code }
	);
}

export function fromRocqGoalAnswerToLspRocqState(state: GoalAnswer<string, string>): LspProofState {
	let goals = state.goals;
	let goal = goals?.goals[0];

	let hyps = goal?.hyps;

	let internals =
		hyps?.filter((v) => v.names[0].startsWith('__internal_name_')).map((v) => v.ty) || [];

	let values = internals
		.filter((v) => v.includes('\\in'))
		.map((v) => v.split('\\in', 2).map((v) => v.trim()))
		.map((v): LspVariable => ({ identifier: v[0], set: v[1] }));

	return {
		variables: values,
		goal: goal?.ty || ''
	};
}
