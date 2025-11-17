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
	string,
	['markdown_header', 'rocq_header', 'cnl_proof'],
	QuestionWidgetValue,
	TrimmedQuestionWidgetValue
>;

export type QuestionPosition =
	| {
			field: 'markdown_header' | 'rocq_header' | 'cnl_proof';
			index: number;
	  }
	| undefined;

export type QuestionWidgetValue = WidgetValue<
	QuestionPosition,
	'question',
	['markdown_header', 'rocq_header', 'cnl_proof']
> & {
	_markdown_header: Omit<MarkdownWidgetValue, 'position' | 'type'>;
	_rocq_header: Omit<RocqWidgetValue, 'position' | 'type'>;
	_cnl_proof: Omit<ProofWidgetValue, 'position' | 'type'>;
};

export type TrimmedQuestionWidgetValue = {
	_markdown_header: Omit<TrimmedWidgetValue<MarkdownWidget>, 'type'>;
	_rocq_header: Omit<TrimmedWidgetValue<RocqWidget>, 'type'>;
	_cnl_proof: Omit<TrimmedWidgetValue<ProofWidget>, 'type'>;
};

declare module '$lib/notebook/structure' {
	interface RootWidgetMap {
		question: QuestionWidget;
	}
}

function strip_child<T extends { position?: unknown; type: unknown }>(
	value: T
): Omit<T, 'position' | 'type'> {
	delete value.position;
	delete value.type;
	return value;
}

function unstrip_child<K extends string, T extends { position?: unknown; type: unknown }>(
	key: K,
	type: T['type'],
	getter: () => Omit<T, 'position' | 'type'>,
	setter: (v: Omit<T, 'position' | 'type'>) => void
): { [key in K]: T } {
	let object = {};
	Object.defineProperty(object, key, {
		get() {
			return { ...getter(), type, position: undefined };
		},
		set(value) {
			strip_child(value);
			setter(value);
		}
	});

	return object as { [key in K]: T };
}

export const QUESTION_WIDGET: QuestionWidget = {
	type: 'question',
	name: 'Question',
	icon: FileQuestionMark,

	component: QuestionWidgetC,
	initial() {
		const value: QuestionWidgetValue = {
			type: 'question',
			_markdown_header: strip_child(MARKDOWN_WIDGET.initial()),
			_rocq_header: strip_child(ROCQ_WIDGET.initial()),
			_cnl_proof: strip_child(PROOF_WIDGET.initial()),
			children: {
				...unstrip_child(
					'cnl_proof',
					'proof',
					(): QuestionWidgetValue['_cnl_proof'] => value._cnl_proof,
					(v) => (value._cnl_proof = v)
				),
				...unstrip_child(
					'markdown_header',
					'markdown',
					(): QuestionWidgetValue['_markdown_header'] => value._markdown_header,
					(v) => (value._markdown_header = v)
				),
				...unstrip_child(
					'rocq_header',
					'rocq',
					(): QuestionWidgetValue['_rocq_header'] => value._rocq_header,
					(v) => (value._rocq_header = v)
				)
			},
			position: undefined
		};
		return value;
	},
	trim(value) {
		return {
			type: value.type,
			_cnl_proof: value._cnl_proof,
			_markdown_header: value._markdown_header,
			_rocq_header: value._rocq_header
		};
	},
	untrim(trimmed) {
		const value: QuestionWidgetValue = {
			type: 'question',
			children: {
				...unstrip_child(
					'cnl_proof',
					'proof',
					(): QuestionWidgetValue['_cnl_proof'] => value._cnl_proof,
					(v) => (value._cnl_proof = v)
				),
				...unstrip_child(
					'markdown_header',
					'markdown',
					(): QuestionWidgetValue['_markdown_header'] => value._markdown_header,
					(v) => (value._markdown_header = v)
				),
				...unstrip_child(
					'rocq_header',
					'rocq',
					(): QuestionWidgetValue['_rocq_header'] => value._rocq_header,
					(v) => (value._rocq_header = v)
				)
			},
			_cnl_proof: PROOF_WIDGET.untrim(trimmed._cnl_proof),
			_markdown_header: MARKDOWN_WIDGET.untrim(trimmed._markdown_header),
			_rocq_header: ROCQ_WIDGET.untrim(trimmed._rocq_header),
			position: undefined
		};

		return value;
	},
	get(v) {
		return v.position;
	},
	getBegin() {
		return { field: 'markdown_header', index: 0 };
	},
	getEnd(v) {
		return { field: 'cnl_proof', index: v._cnl_proof.value.length };
	},
	isFirst(v) {
		return v.position?.field === 'markdown_header' && v.position.index === 0;
	},
	isLast(v) {
		return v.position?.field === 'cnl_proof' && v.position.index === v._cnl_proof.value.length;
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
			markdown_header: v._markdown_header.value.length,
			rocq_header: v._rocq_header.value.length,
			cnl_proof: v._cnl_proof.value.length
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
