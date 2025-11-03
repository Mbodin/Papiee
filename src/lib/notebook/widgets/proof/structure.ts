import { register } from '$lib/notebook/structure';
import type { Widget, WidgetValue } from '$lib/notebook/widgets/types';
import { NotebookPenIcon } from '@lucide/svelte';
import type { ProofDocumentValue } from './values';
import ProofDocument from '$lib/components/widgets/proof/ProofDocument.svelte';

export type ProofWidget = Widget<number, 'proof', ProofWidgetValue, 'value'>;
export type ProofWidgetValue = WidgetValue<number> & { value: ProofDocumentValue };

declare module '$lib/notebook/structure' {
	interface RootWidgetMap {
		proof: ProofWidget;
	}
}

export const PROOF_WIDGET: ProofWidget = {
	type: 'proof',
	name: 'Proof',
	icon: NotebookPenIcon,

	component: ProofDocument,
	initial() {
		return {
			type: 'proof',
			value: '',
			position: undefined
		};
	},
	trim(value) {
		return {
			value: value.value
		};
	},
	untrim(trimmed) {
		return {
			type: 'markdown',
			position: 0,
			value: trimmed.value
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
};

register('proof', () => PROOF_WIDGET);
