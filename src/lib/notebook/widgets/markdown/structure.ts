import MarkdownWidgetC from '$lib/components/widgets/MarkdownWidget.svelte';
import { register } from '$lib/notebook/structure';
import type { Widget, WidgetValue } from '$lib/notebook/widgets/types';

export type MarkdownWidget = Widget<number, 'markdown', MarkdownWidgetValue, 'value' | 'compiled'>;
export type MarkdownWidgetValue = WidgetValue<number> & { value: string; compiled: boolean };

declare module '$lib/notebook/structure' {
	interface RootWidgetMap {
		markdown: MarkdownWidget;
	}
}

export const MARKDOWN_WIDGET: MarkdownWidget = {
	name: 'markdown',
	component: MarkdownWidgetC,
	initial() {
		return {
			type: 'markdown',
			value: '',
			position: undefined,
			compiled: true
		};
	},
	trim(value) {
		return {
			value: value.value,
			compiled: value.compiled
		};
	},
	untrim(trimmed) {
		return {
			type: 'markdown',
			position: 0,
			value: trimmed.value,
			compiled: trimmed.compiled
		};
	},
	getBegin() {
		return 0;
	},
	getEnd(v) {
		return v.value.length;
	},
	isFirst(v) {
		return v.position === 0;
	},
	isLast(v) {
		return v.position === v.value.length;
	},
	moveLeft(v) {
		return Math.max((v?.position || 0) - 1, 0);
	},
	moveRight(v) {
		return Math.min((v?.position || 0) + 1, v.value.length);
	},
	moveTo(v, position) {
		return { ...v, position };
	}
};

register('markdown', () => MARKDOWN_WIDGET);
