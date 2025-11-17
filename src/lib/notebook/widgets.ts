import type { Component } from 'svelte';

let widgets: Component<{}, {}>[] = [];

export function addWidget(value: Component<{}, {}>) {
	widgets.push(value);
}

export function getWidgets(): readonly Component<{}, {}>[] {
	return widgets;
}
