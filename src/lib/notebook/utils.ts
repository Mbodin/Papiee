import {
	getNotebookNode,
	getNotebookNode_unsafe,
	type NotebookState
} from '$lib/notebook/structure';
import type { NotebookNode, NotebookNodeValue } from './nodes/types';

export function comparePosition(pos1: number[], pos2: number[]): number {
	if (pos1.length === 0)
		if (pos2.length === 0) return 0;
		else return 1;
	if (pos2.length === 0) return -1;
	for (let i = 0; i < Math.max(pos1.length, pos2.length); i++) {
		if (pos1.length <= i) return 1;
		if (pos2.length <= i) return -1;
		if (pos1[i] < pos2[i]) return 1;
		if (pos2[i] < pos1[i]) return -1;
	}

	return 0;
}

export function visit(
	node: NotebookNodeValue | NotebookState,
	f: (node: NotebookNodeValue, pos: number[]) => void,
	current_position: number[] = []
) {
	if (node == undefined) return;
	if ('title' in node) {
		Object.values(node.children).map((v, i) => visit(v, f, [...current_position, i]));
		return;
	}
	f(node, current_position);

	let children_keys = getNotebookNode_unsafe(node.type).children;
	if (children_keys == null) {
		children_keys = Object.keys(node.children);
	}
	children_keys.map((v, i) => visit(node.children[v as any], f, [...current_position, i]));
}
