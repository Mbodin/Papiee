import MarkdownNodeC from '$lib/components/nodes/MarkdownNode.svelte';
import { register } from '$lib/notebook/structure';
import type { NotebookNode, NotebookNodeValue } from '$lib/notebook/nodes/types';
import { FileTextIcon } from '@lucide/svelte';

export type MarkdownNode = NotebookNode<
	number,
	'markdown',
	[],
	MarkdownNodeValue,
	Omit<MarkdownNodeValue, 'position' | 'type' | 'children'>
>;
export type MarkdownNodeValue = NotebookNodeValue<number, 'markdown', []> & {
	value: string;
	compiled: boolean;
};

declare module '$lib/notebook/structure' {
	interface RootNodeMap {
		markdown: MarkdownNode;
	}
}

export const MARKDOWN_NODE: MarkdownNode = {
	type: 'markdown',
	name: 'Markdown',
	icon: FileTextIcon,

	component: MarkdownNodeC,
	initial() {
		return {
			type: 'markdown',
			value: '',
			position: undefined,
			children: {},
			compiled: false
		};
	},
	trim(value) {
		return {
			type: 'markdown',
			value: value.value,
			compiled: value.compiled
		};
	},
	untrim(trimmed) {
		return {
			type: 'markdown',
			position: 0,
			value: trimmed.value,
			children: {},
			compiled: trimmed.compiled
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

register('markdown', () => MARKDOWN_NODE);
