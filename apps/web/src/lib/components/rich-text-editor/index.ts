export { default as RichTextEditor } from './RichTextEditor.svelte';

export type RichTextTypes =
	| 'paragraph'
	| 'heading-1'
	| 'heading-2'
	| 'heading-3'
	| 'blockquote'
	| 'code'
	| 'bullet-list'
	| 'ordered-list';
