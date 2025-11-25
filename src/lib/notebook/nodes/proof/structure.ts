import { register } from '$lib/notebook/structure';
import {
	makeLeafNotebookNode,
	type LeafNodebookNode,
	type NotebookNode,
	type NotebookNodeValue
} from '$lib/notebook/nodes/types';
import ProofNodeC from '$lib/components/nodes/ProofNode.svelte';
import type { CnlParsingState } from '$lib/cnl/cnl_tactic';

export type ProofNode = LeafNodebookNode<number, 'proof', ProofNodeValue, Data>;
export type ProofNodeValue = NotebookNodeValue<number, 'proof'> & Data;

export type ProofNodeState = 'done' | 'admit' | 'error' | undefined;
type Data = {
	value: string;
	initial_state: CnlParsingState;
	state?: ProofNodeState | 'loading';
};

declare module '$lib/notebook/structure' {
	interface RootNodeMap {
		proof: ProofNode;
	}
}

export const PROOF_NODE: ProofNode = makeLeafNotebookNode({
	type: 'proof',

	component: ProofNodeC,
	initial() {
		return {
			type: 'proof',
			value: '',
			children: {},
			initial_state: ['START'],
			position: undefined
		};
	},
	trim(value) {
		return {
			value: value.value,
			initial_state: value.initial_state
		};
	},
	untrim(trimmed) {
		return {
			type: 'proof',
			value: trimmed.value,
			initial_state: trimmed.initial_state,
			children: {},
			position: 0
		};
	},
	get(value) {
		return value.position;
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

register('proof', () => PROOF_NODE);
