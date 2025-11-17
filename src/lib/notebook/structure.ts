import type { NotebookNode, NotebookNodeValue } from './nodes/types';

export interface RootNodeMap {}

const REGISTRY: Partial<RootNodeMap> = {};

export function register<
	T extends RootNodeMap[keyof RootNodeMap],
	U extends T['type'] & keyof RootNodeMap
>(value: U, constructor: () => T) {
	(REGISTRY as any)[value] = constructor();
}

export function getNotebookNodes(only_rootable?: boolean): NotebookNode[] {
	return Object.values(REGISTRY)
		.map((v) => v as unknown as NotebookNode)
		.filter((v) => !only_rootable || (only_rootable && 'name' in v));
}

export function getNotebookNode<T extends keyof RootNodeMap>(value: T) {
	return REGISTRY[value];
}

export function getNotebookNode_unsafe(value: string) {
	return REGISTRY[value as keyof RootNodeMap]! as unknown as NotebookNode;
}

export type NotebookState = {
	title: string;
	children: NotebookNodeValue[];
};
