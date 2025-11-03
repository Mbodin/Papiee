import type { Component } from 'svelte';

export type Widget<
	Position = unknown,
	Type extends string = string,
	Value extends WidgetValue<Position> = WidgetValue<Position, Type>,
	ToKeepWhenTrimmed extends keyof Value = never
> = {
	name: string;
	type: Type;
	icon?: Component;

	trim(value: Value): Pick<Value, ToKeepWhenTrimmed>;
	untrim(trimmed: Pick<Value, ToKeepWhenTrimmed>): Value;
	initial(): Value;
	component: Component<WidgetProps<Value>>;
} & PositionHelper<Value, Position>;

export type WidgetValue<Position = unknown, Type extends string = string> = {
	type: Type;
	position?: Position | undefined;
};

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

export type WidgetProps<Value extends WidgetValue = WidgetValue> = {
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
};
