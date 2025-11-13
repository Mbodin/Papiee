import type { CompletionState } from '$lib/components/widgets/proof/ProofAutoCompletion.svelte';
import { Schema, type MarkSpec, type NodeSpec } from 'prosemirror-model';

export const nodes = {
	doc: { content: 'content' },
	paragraph: {
		content: 'line content?',
		toDOM(node) {
			return ['div', { class: 'paragraph' }, 0];
		},
		parseDOM: [
			{
				tag: 'div.paragraph'
			}
		]
	},
	line: {
		content: 'inline*',
		toDOM(node) {
			return ['div', { class: 'paragraph-line' }, 0];
		},
		parseDOM: [
			{
				tag: 'div.paragraph-line'
			}
		]
	},
	content: {
		content: 'paragraph+',
		toDOM(node) {
			return ['div', { class: 'paragraph-content' }, 0];
		},
		parseDOM: [
			{
				tag: 'div.paragraph-content'
			}
		]
	},
	text: {
		group: 'inline',
		toDOM(node) {
			return ['span', { class: 'pm-text' }, 0];
		},
		parseDOM: [{ tag: 'span.pm-text' }]
	}
} satisfies { [key: string]: NodeSpec };

export const marks = {
	selected: {
		attrs: {
			completion: {
				default: undefined as CompletionState | undefined
			}
		}
	},
	chunks: {
		attrs: {
			value: {}
		}
	}
} satisfies { [key: string]: MarkSpec };

export const schema = new Schema({ nodes, marks });
