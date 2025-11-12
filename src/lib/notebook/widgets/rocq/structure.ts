import RocqWidgetC from '$lib/components/widgets/RocqWidget.svelte';
import { register } from '$lib/notebook/structure';
import type { Widget, WidgetValue } from '$lib/notebook/widgets/types';

export type RocqWidget = Widget<number, 'rocq', RocqWidgetValue, { value: string }>;
export type RocqWidgetValue = WidgetValue<number> & { value: string };

declare module '$lib/notebook/structure' {
	interface RootWidgetMap {
		rocq: RocqWidget;
	}
}

export const ROCQ_WIDGET: RocqWidget = {
	type: 'rocq',

	component: RocqWidgetC,
	initial() {
		return {
			type: 'rocq',
			value: '(*Rocq file*)',
			position: undefined,
			compiled: false
		};
	},
	trim(value) {
		return {
			type: 'rocq',
			value: value.value
		};
	},
	untrim(trimmed) {
		return {
			type: 'rocq',
			position: 0,
			value: trimmed.value
		};
	},
	get(v) {
		return v.position;
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

register('rocq', () => ROCQ_WIDGET);
