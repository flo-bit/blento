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
		contentDict = $bindable(),
		key,
		class: className,
		placeholder = '',
		defaultContent = '',
		onupdate
	}: {
		contentDict: Record<string, any>;
		key: string;
		class?: string;
		placeholder?: string;
		defaultContent?: string;
		onupdate?: (content: string) => void;
	} = $props();

	const update = async () => {
		if (!editor) return;

		const text = editor.getText();

		contentDict[key] = text;

		onupdate?.(text);
	};

	// Keep the editor in sync when the bound value changes from outside (e.g. edited
	// in the settings sidebar) without disrupting the user while they type here.
	$effect(() => {
		const incoming = contentDict[key] ?? defaultContent ?? '';
		if (!editor || editor.isFocused) return;
		if (editor.getText() === incoming) return;
		editor.commands.setContent(incoming, { emitUpdate: false });
	});

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

			content: contentDict[key] ?? defaultContent,

			editorProps: {
				attributes: {
					class: 'outline-none pointer-events-auto'
				},
				handleKeyDown: (_view, event) => {
					// Prevent newlines by blocking Enter key
					if (event.key === 'Enter') {
						return true;
					}
					return false;
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
