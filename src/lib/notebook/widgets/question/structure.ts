import QuestionWidgetC from '$lib/components/widgets/QuestionWidget.svelte';
import { register } from '$lib/notebook/structure';
import type { TrimmedWidgetValue, Widget, WidgetValue } from '$lib/notebook/widgets/types';
import { FileQuestionMark } from '@lucide/svelte';
import {
	MARKDOWN_WIDGET,
	type MarkdownWidget,
	type MarkdownWidgetValue
} from '../markdown/structure';
import { ROCQ_WIDGET, type RocqWidget, type RocqWidgetValue } from '../rocq/structure';
import { PROOF_WIDGET, type ProofWidget, type ProofWidgetValue } from '../proof/structure';

export type QuestionWidget = Widget<
	QuestionPosition,
	'question',
	QuestionWidgetValue,
	TrimmedQuestionWidgetValue
>;

export type QuestionPosition =
	| {
			field: 'markdown_header' | 'rocq_header' | 'cnl_proof';
			index: number;
	  }
	| undefined;

export type QuestionWidgetValue = WidgetValue<QuestionPosition> & {
	markdown_header: Omit<MarkdownWidgetValue, 'position' | 'type'>;
	rocq_header: Omit<RocqWidgetValue, 'position' | 'type'>;
	cnl_proof: Omit<ProofWidgetValue, 'position' | 'type'>;
};

export type TrimmedQuestionWidgetValue = {
	markdown_header: Omit<TrimmedWidgetValue<MarkdownWidget>, 'type'>;
	rocq_header: Omit<TrimmedWidgetValue<RocqWidget>, 'type'>;
	cnl_proof: Omit<TrimmedWidgetValue<ProofWidget>, 'type'>;
};

declare module '$lib/notebook/structure' {
	interface RootWidgetMap {
		question: QuestionWidget;
	}
}

export const QUESTION_WIDGET: QuestionWidget = {
	type: 'question',
	name: 'Question',
	icon: FileQuestionMark,

	component: QuestionWidgetC,
	initial() {
		return {
			type: 'question',
			markdown_header: MARKDOWN_WIDGET.initial(),
			rocq_header: ROCQ_WIDGET.initial(),
			cnl_proof: PROOF_WIDGET.initial(),
			position: undefined
		};
	},
	trim(value) {
		return {
			type: value.type,
			markdown_header: MARKDOWN_WIDGET.trim({ type: 'markdown', ...value.markdown_header }),
			rocq_header: ROCQ_WIDGET.trim({ type: 'rocq', ...value.rocq_header }),
			cnl_proof: PROOF_WIDGET.trim({ type: 'proof', ...value.cnl_proof })
		};
	},
	untrim(trimmed) {
		return {
			type: 'question',
			markdown_header: MARKDOWN_WIDGET.untrim({ ...trimmed.markdown_header }),
			rocq_header: ROCQ_WIDGET.untrim({ ...trimmed.rocq_header }),
			cnl_proof: PROOF_WIDGET.untrim({ ...trimmed.cnl_proof }),
			position: undefined
		};
	},
	get(v) {
		return v.position;
	},
	getBegin() {
		return { field: 'markdown_header', index: 0 };
	},
	getEnd(v) {
		return { field: 'cnl_proof', index: v.cnl_proof.value.length };
	},
	isFirst(v) {
		return v.position?.field === 'markdown_header' && v.position.index === 0;
	},
	isLast(v) {
		return v.position?.field === 'cnl_proof' && v.position.index === v.cnl_proof.value.length;
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
			markdown_header: v.markdown_header.value.length,
			rocq_header: v.rocq_header.value.length,
			cnl_proof: v.cnl_proof.value.length
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

register('question', () => QUESTION_WIDGET);
