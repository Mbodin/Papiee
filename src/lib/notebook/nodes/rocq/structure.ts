import RocqNodeC from '$lib/components/nodes/RocqNode.svelte';
import { register } from '$lib/notebook/structure';
import {
	makeLeafNotebookNode,
	type LeafNodebookNode,
	type NotebookNode,
	type NotebookNodeValue
} from '$lib/notebook/nodes/types';
import { SquareChartGantt } from '@lucide/svelte';

export type RocqNode = LeafNodebookNode<number, 'rocq', RocqNodeValue, { value: string }>;
export type RocqNodeValue = NotebookNodeValue<number, 'rocq', [], {}> & { value: string };

declare module '$lib/notebook/structure' {
	interface RootNodeMap {
		rocq: RocqNode;
	}
}

type A = RocqNode['component'];

export const ROCQ_NODE: RocqNode = makeLeafNotebookNode({
	type: 'rocq',
	name: 'Rocq',
	icon: SquareChartGantt,

	component: RocqNodeC,
	initial() {
		return {
			type: 'rocq',
			value: '(*Rocq file*)',
			position: undefined,
			children: {},
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
			value: trimmed.value,
			children: {}
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
});

register('rocq', () => ROCQ_NODE);
