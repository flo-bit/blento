<script lang="ts">
	import type { Item } from '$lib/types';
	import type { Editor } from '@tiptap/core';
	import { textAlignClasses, textSizeClasses, verticalAlignClasses } from '../TextCard';
	import type { ContentComponentProps } from '../../types';
	import MarkdownTextEditor from '$lib/components/MarkdownTextEditor.svelte';
	import { cn } from '@foxui/core';

	let { item = $bindable<Item>() }: ContentComponentProps = $props();

	let frontEditor: Editor | null = $state(null);
	let backEditor: Editor | null = $state(null);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col">
		<span class="text-base-500 dark:text-base-400 px-6 pt-2 text-xs font-medium">Front</span>
		<div
			class={cn(
				'prose dark:prose-invert prose-neutral prose-sm prose-a:no-underline prose-a:text-accent-600 dark:prose-a:text-accent-400 accent:prose-a:text-accent-950 accent:prose-a:underline accent:prose-p:text-base-900 hover:bg-base-700/5 accent:hover:bg-accent-300/20 prose-p:first:mt-0 prose-p:last:mb-0 inline-flex min-h-0 w-full max-w-none flex-1 cursor-text overflow-y-scroll rounded-md px-6 py-4 text-lg transition-colors duration-150',
				textAlignClasses[item.cardData.textAlign as string],
				verticalAlignClasses[item.cardData.verticalAlign as string],
				textSizeClasses[(item.cardData.textSize ?? 0) as number]
			)}
			onclick={() => {
				if (frontEditor?.isFocused) return;
				frontEditor?.commands.focus('end');
			}}
		>
			<MarkdownTextEditor
				bind:contentDict={item.cardData}
				key="frontText"
				bind:editor={frontEditor}
			/>
		</div>
	</div>

	<div class="border-base-200 dark:border-base-700 mx-4 border-t"></div>

	<div class="flex min-h-0 flex-1 flex-col">
		<span class="text-base-500 dark:text-base-400 px-6 pt-2 text-xs font-medium">Back</span>
		<div
			class={cn(
				'prose dark:prose-invert prose-neutral prose-sm prose-a:no-underline prose-a:text-accent-600 dark:prose-a:text-accent-400 accent:prose-a:text-accent-950 accent:prose-a:underline accent:prose-p:text-base-900 hover:bg-base-700/5 accent:hover:bg-accent-300/20 prose-p:first:mt-0 prose-p:last:mb-0 inline-flex min-h-0 w-full max-w-none flex-1 cursor-text overflow-y-scroll rounded-md px-6 py-4 text-lg transition-colors duration-150',
				textAlignClasses[item.cardData.textAlign as string],
				verticalAlignClasses[item.cardData.verticalAlign as string],
				textSizeClasses[(item.cardData.textSize ?? 0) as number]
			)}
			onclick={() => {
				if (backEditor?.isFocused) return;
				backEditor?.commands.focus('end');
			}}
		>
			<MarkdownTextEditor
				bind:contentDict={item.cardData}
				key="backText"
				bind:editor={backEditor}
			/>
		</div>
	</div>
</div>
