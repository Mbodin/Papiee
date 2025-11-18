import QuestionNodeC from '$lib/components/nodes/QuestionNode.svelte';
import { register } from '$lib/notebook/structure';
import type {
	TrimmedNotebookNodeValue,
	NotebookNode,
	NotebookNodeValue
} from '$lib/notebook/nodes/types';
import { FileQuestionMark } from '@lucide/svelte';
import { MARKDOWN_NODE, type MarkdownNode, type MarkdownNodeValue } from '../markdown/structure';
import { ROCQ_NODE, type RocqNode, type RocqNodeValue } from '../rocq/structure';
import { PROOF_NODE, type ProofNode, type ProofNodeValue } from '../proof/structure';

export type QuestionNode = NotebookNode<
	QuestionPosition,
	string,
	['markdown_header', 'rocq_header', 'cnl_proof'],
	{
		markdown_header: Omit<MarkdownNodeValue, 'position' | 'type'>;
		rocq_header: Omit<RocqNodeValue, 'position' | 'type'>;
		cnl_proof: Omit<ProofNodeValue, 'position' | 'type'>;
	},
	{
		markdown_header: Omit<TrimmedNotebookNodeValue<MarkdownNode>, 'type'>;
		rocq_header: Omit<TrimmedNotebookNodeValue<RocqNode>, 'type'>;
		cnl_proof: Omit<TrimmedNotebookNodeValue<ProofNode>, 'type'>;
	},
	QuestionNodeValue,
	TrimmedQuestionNodeValue
>;

export type QuestionPosition =
	| {
			field: 'markdown_header' | 'rocq_header' | 'cnl_proof';
			index: number;
	  }
	| undefined;

export type QuestionNodeValue = NotebookNodeValue<
	QuestionPosition,
	'question',
	['markdown_header', 'rocq_header', 'cnl_proof']
>;

export type TrimmedQuestionNodeValue = {
	children: {
		markdown_header: Omit<TrimmedNotebookNodeValue<MarkdownNode>, 'type'>;
		rocq_header: Omit<TrimmedNotebookNodeValue<RocqNode>, 'type'>;
		cnl_proof: Omit<TrimmedNotebookNodeValue<ProofNode>, 'type'>;
	};
};

declare module '$lib/notebook/structure' {
	interface RootNodeMap {
		question: QuestionNode;
	}
}

function removeFrom<K extends (keyof T)[], T extends { [k in K[number]]?: unknown }>(
	obj: T,
	...keys: K
): Omit<T, K[number]> {
	keys.forEach((key) => delete obj[key]);
	return obj;
}

export const QUESTION_NODE: QuestionNode = {
	type: 'question',
	name: 'Question',
	icon: FileQuestionMark,
	children: ['markdown_header', 'rocq_header', 'cnl_proof'],

	component: QuestionNodeC,
	initial() {
		return {
			type: 'question',
			children: {
				markdown_header: removeFrom(MARKDOWN_NODE.initial(), 'position'),
				rocq_header: removeFrom(ROCQ_NODE.initial(), 'position'),
				cnl_proof: removeFrom(PROOF_NODE.initial(), 'position')
			},
			position: undefined
		};
	},
	trim(value) {
		return {
			type: value.type,
			children: {
				markdown_header: this.trim_child['markdown_header'](value.children.markdown_header),
				cnl_proof: this.trim_child['cnl_proof'](value.children.cnl_proof),
				rocq_header: this.trim_child['rocq_header'](value.children.rocq_header)
			}
		};
	},
	untrim(trimmed) {
		return {
			type: 'question',
			children: {
				markdown_header: this.untrim_child['markdown_header'](trimmed.children.markdown_header),
				cnl_proof: this.untrim_child['cnl_proof'](trimmed.children.cnl_proof),
				rocq_header: this.untrim_child['rocq_header'](trimmed.children.rocq_header)
			},
			position: undefined
		};
	},
	trim_child: {
		markdown_header: (v) => MARKDOWN_NODE.trim({ type: 'markdown', ...v }),
		cnl_proof: (v) => PROOF_NODE.trim({ type: 'proof', ...v }),
		rocq_header: (v) => ROCQ_NODE.trim({ type: 'rocq', ...v })
	},
	untrim_child: {
		markdown_header: (v) => removeFrom(MARKDOWN_NODE.untrim(v), 'position'),
		cnl_proof: (v) => removeFrom(PROOF_NODE.untrim(v), 'position'),
		rocq_header: (v) => removeFrom(ROCQ_NODE.untrim(v), 'position')
	},
	get(v) {
		return v.position;
	},
	getBegin() {
		return { field: 'markdown_header', index: 0 };
	},
	getEnd(v) {
		return { field: 'cnl_proof', index: v.children.cnl_proof.value.length };
	},
	isFirst(v) {
		return v.position?.field === 'markdown_header' && v.position.index === 0;
	},
	isLast(v) {
		return (
			v.position?.field === 'cnl_proof' && v.position.index === v.children.cnl_proof.value.length
		);
	},
	moveLeft(v) {
		if (v.position && v.position?.index !== 0) {
			return { field: v.position.field, index: v.position.index - 1 };
		}
		return v.position;
	},
	moveRight(v) {
		if (!v.position) return undefined;

		const selected_field_length = {
			markdown_header: v.children.markdown_header.value.length,
			rocq_header: v.children.rocq_header.value.length,
			cnl_proof: v.children.cnl_proof.value.length
		}[v.position.field];

		if (v.position && v.position?.index !== selected_field_length) {
			return { field: v.position.field, index: v.position.index + 1 };
		}
		return v.position;
	},
	moveTo(v, position) {
		return { ...v, position };
	}
};

register('question', () => QUESTION_NODE);
