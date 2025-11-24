import { Schema, type NodeSpec } from 'prosemirror-model';

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
		content: 'chunk+',
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
	chunk: {
		group: 'chunk',
		content: 'text*',
		attrs: {
			value: {
				default: undefined
			}
		},
		toDOM(node) {
			return ['div', { class: 'paragraph-line-chunk' }, 0];
		},
		parseDOM: [
			{
				tag: 'div.paragraph-line-chunk'
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

export const schema = new Schema({ nodes });
