<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { Editor, type Content, type Extensions } from '@tiptap/core';
	import StarterKit from '@tiptap/starter-kit';
	import Image from '@tiptap/extension-image';
	import Placeholder from '@tiptap/extension-placeholder';
	import Link from '@tiptap/extension-link';
	import { marked } from 'marked';
	import { generateJSON } from '@tiptap/core';
	import TurndownService from 'turndown';
	import { RichTextLink } from './extensions/RichTextLink';
	import type { Item } from '$lib/types';

	let element: HTMLElement | undefined = $state();

	let loaded = $state(false);

	let {
		editor = $bindable(),
		item = $bindable(),
		placeholder = '',
		defaultContent = ''
	}: {
		editor: Editor | null;
		item: Item;
		placeholder?: string;
		defaultContent?: string;
	} = $props();

	const update = async () => {
		if (!editor) return {};

		const html = editor.getHTML();

		var turndownService = new TurndownService({
			headingStyle: 'atx',
			bulletListMarker: '-'
		});
		const markdown = turndownService.turndown(html);

		item.cardData.text = markdown;
	};

	onMount(async () => {
		if (!element || editor) return;

		let json: Content = '';

		try {
			let html = await marked.parse(item.cardData.text ?? (defaultContent as string));

			// parse to json
			json = generateJSON(html, [
				StarterKit.configure({
					heading: false,
					bulletList: false,
					codeBlock: false
				}),
				Image.configure(),
				RichTextLink.configure({
					openOnClick: false
				})
			]);
		} catch (error) {
			console.error(error);
		}

		let extensions: Extensions = [
			StarterKit.configure({
				heading: false,
				bulletList: false,
				codeBlock: false,
				dropcursor: false
			}),
			Image.configure(),
			Link.configure({
				openOnClick: false
			})
		];

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
			onDrop: () => {
				return false;
			},
			content: json,

			editorProps: {
				attributes: {
					class: 'outline-none w-full'
				},
				handleDOMEvents: { drop: () => false }
			}
		});

		loaded = true;
	});

	onDestroy(() => {
		if (editor) {
			editor.destroy();
		}
	});
</script>

<div class="w-full cursor-text" bind:this={element}></div>

<style>
	:global(.tiptap p.is-editor-empty:first-child::before) {
		color: var(--color-base-800);
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}
	:global(.dark .tiptap p.is-editor-empty:first-child::before) {
		color: var(--color-base-200);
	}
</style>
