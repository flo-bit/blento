<script lang="ts">
	import type { Item } from '$lib/types';
	import type { Editor } from '@tiptap/core';
	import { textAlignClasses, textSizeClasses, verticalAlignClasses } from '.';
	import type { ContentComponentProps } from '../types';
	import MarkdownTextEditor from '../utils/MarkdownTextEditor.svelte';
	import { cn } from '@foxui/core';

	let { item = $bindable<Item>() }: ContentComponentProps = $props();

	let editor: Editor | null = $state(null);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class={cn(
		'prose dark:prose-invert prose-neutral prose-sm prose-a:no-underline prose-a:text-accent-600 dark:prose-a:text-accent-400 accent:prose-a:text-accent-950 accent:prose-a:underline accent:prose-p:text-base-900 hover:bg-base-700/5 accent:hover:bg-accent-300/20 prose-p:first:mt-0 prose-p:last:mb-0 inline-flex h-full w-full max-w-none cursor-text overflow-y-scroll rounded-md p-2 text-lg transition-colors duration-150',
		textAlignClasses[item.cardData.textAlign as string],
		verticalAlignClasses[item.cardData.verticalAlign as string],
		textSizeClasses[(item.cardData.textSize ?? 0) as number]
	)}
	onclick={() => {
		if (editor?.isFocused) return;

		editor?.commands.focus('end');
	}}
>
	<MarkdownTextEditor bind:item bind:editor />
</div>
