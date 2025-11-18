import type { NotebookState } from '$lib/notebook/structure';
import type { TagParseRule } from 'prosemirror-model';
import type { Component } from 'svelte';

export type NotebookNode<
	Position = any,
	Type extends string = string,
	children_keys extends string[] = string[],
	children_elts extends Record<children_keys[number], any> = Record<children_keys[number], any>,
	trimmed_children_elts extends Record<children_keys[number], any> = Record<
		children_keys[number],
		any
	>,
	Value extends NotebookNodeValue<Position, Type, children_keys> = NotebookNodeValue<
		Position,
		Type,
		children_keys,
		children_elts
	>,
	TrimmedValue extends children_keys[number] extends never
		? any
		: { children: trimmed_children_elts } = any
> = {
	type: Type;

	name?: string;
	icon?: Component<NotebookNodeProps<Value>>;
	/**
	 * Define the order of the children position wise
	 */
	children: children_keys;
	trim(value: Value): TrimmedValue;
	untrim(trimmed: TrimmedValue): Value;
	initial(): Value;

	trim_child: {
		[K in children_keys[number]]: (value: children_elts[K]) => trimmed_children_elts[K];
	};

	untrim_child: {
		[K in children_keys[number]]: (value: trimmed_children_elts[K]) => children_elts[K];
	};

	component: Component<NotebookNodeProps<Value>>;
} & PositionHelper<Value, Position>;

export type LeafNodebookNode<
	Position = any,
	Type extends string = string,
	Value extends NotebookNodeValue<Position, Type, []> = NotebookNodeValue<Position, Type, [], {}>,
	TrimmedValue extends any = any
> = NotebookNode<Position, Type, [], {}, {}, Value, TrimmedValue>;

export function makeLeafNotebookNode<
	T extends LeafNodebookNode<Position, Type, Value, TrimmedValue>,
	Position = any,
	Type extends string = string,
	Value extends NotebookNodeValue<Position, Type, []> = NotebookNodeValue<Position, Type, [], {}>,
	TrimmedValue extends any = any
>(value: Omit<T, 'children' | 'trim_child' | 'untrim_child'>): T {
	return {
		...value,

		children: [],
		trim_child: {},
		untrim_child: {}
	} as T;
}

export type NotebookNodeValue<
	Position = any,
	Type extends string = string,
	children_keys extends string[] = string[],
	children_elts extends Record<children_keys[number], any> = Record<children_keys[number], any>
> = {
	type: Type;
	position?: Position | undefined;
	children: {
		[key in children_keys[number]]: children_elts[key];
	};
};

export type TrimmedNotebookNodeValue<T> = T extends { trim: (...args: any) => infer O } ? O : never;

export type PositionHelper<Value extends any, Position> = {
	isLast(value: Value): boolean;
	isFirst(value: Value): boolean;

	// Should get the current position stored in the value
	// Maybe undefined if element is not focused
	get(value: Value): Position | undefined;
	getBegin(value: Value): Position;
	getEnd(value: Value): Position;

	moveLeft(value: Value): Position; // Should "decrement" the position
	moveRight(value: Value): Position; // Should "increment" the position
	moveTo(value: Value, position?: Position): Value;
};

export type NotebookNodeProps<Value extends NotebookNodeValue> = {
	/**
	 * The current value of the widget
	 *
	 */
	readonly value: Value;
	/**
	 * Should change the position of the node option tooltip
	 * @param node The new element node for the node option tooltip to be anchored vertically to
	 * @returns
	 */
	setAnchorNode: (node: HTMLElement | undefined) => void;
	/**
	 * Is called by the widget for the parent to register that its value changed
	 * The parent should use this function to update it's memory
	 * @param old_value The value before the update
	 * @param new_value The value after the update
	 * @returns
	 */
	onNodeValueUpdate: (old_value: Value, new_value: Value) => void;
	/**
	 * Enable notebook nodes to behave differently if they are the currently anchored widget
	 * @returns
	 */
	isAnchored: () => boolean;

	/**
	 * Enable notebook nodes views to render differently if the document is being viewed by a teacher or a student
	 */
	mode: 'teacher' | 'student';

	/**
	 * Uniquely identify a widget node through the iterative parent index
	 *
	 * Example :
	 * 	Parent :
	 * 		ChildA
	 * 		ChildB
	 *  Parent :
	 * 		ChildC
	 *
	 * [0, 1] refers to ChildA
	 * [1, 1] refers to ChildC
	 *
	 * [0] is valid and refers to Parent node
	 *
	 * [] refers to the root
	 */
	position: number[];

	/**
	 * Enable access to the root node
	 */
	root: NotebookState;
};
