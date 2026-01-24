<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Editor, type Extensions } from '@tiptap/core';
	import Placeholder from '@tiptap/extension-placeholder';
	import Paragraph from '@tiptap/extension-paragraph';
	import Document from '@tiptap/extension-document';
	import Text from '@tiptap/extension-text';
	import type { Item } from '$lib/types';

	let element: HTMLElement | undefined = $state();
	let editor: Editor | null = $state(null);

	let {
		item = $bindable(),
		key,
		class: className,
		placeholder = '',
		defaultContent = ''
	}: {
		item: Item;
		key: string;
		class?: string;
		placeholder?: string;
		defaultContent?: string;
	} = $props();

	const update = async () => {
		if (!editor) return;

		item.cardData[key] = editor.getText();
	};

	onMount(async () => {
		if (!element || editor) return;

		let extensions: Extensions = [Document.configure(), Paragraph.configure(), Text.configure()];

		if (placeholder) {
			extensions.push(
				Placeholder.configure({
					placeholder: placeholder
				})
			);
		}

		editor = new Editor({
			element: element,
			extensions: extensions,
			onTransaction: () => {
				editor = editor;
			},
			onUpdate: () => {
				update();
			},

			content: item.cardData[key] ?? defaultContent,

			editorProps: {
				attributes: {
					class: 'outline-none pointer-events-auto'
				}
			}
		});
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});
</script>

<span class={className} bind:this={element}></span>

<style>
	:global(.tiptap p.is-editor-empty:first-child::before) {
		color: var(--color-base-500);
		content: attr(data-placeholder);
		opacity: 100%;
		float: left;
		height: 0;
		pointer-events: none;
	}
</style>
