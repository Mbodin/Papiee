import type { Widget, WidgetValue } from './widgets/types';

export type NotebookNode<U, T> = { type: U; children: T[] };

export interface RootWidgetMap {}

const REGISTRY: Partial<RootWidgetMap> = {};

export function register<
	T extends RootWidgetMap[keyof RootWidgetMap],
	U extends T['name'] & keyof RootWidgetMap
>(value: U, constructor: () => T) {
	REGISTRY[value] = constructor();
}

export function getWidgets(): Widget[] {
	return Object.values(REGISTRY).map((v) => v as unknown as Widget);
}

export function getWidget<T extends keyof RootWidgetMap>(value: T) {
	return REGISTRY[value];
}

export function getWidget_unsafe(value: string) {
	return REGISTRY[value as keyof RootWidgetMap]! as unknown as Widget;
}

export type NotebookState = WidgetValue[];
