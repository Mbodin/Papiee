import type { EditorView } from 'prosemirror-view';

export type CompletionState = {
	from: number;
	to: number;
	view: EditorView;
	value: string[];
	selected: number;
};

export type ProofCompleteProps = {
	state: CompletionState;
	hide?: boolean;
};

export let proof_complete_value_selector: { value: string | undefined } = $state({
	value: undefined
});

export let proof_complete_value: { value: undefined } | { value: ProofCompleteProps } = $state({
	value: undefined
});
