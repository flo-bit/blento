<script lang="ts">
	import type { Item } from '$lib/types';
	import { textAlignClasses, verticalAlignClasses } from '.';
	import type { ContentComponentProps } from '../types';
	import MarkdownTextEditor from '../utils/MarkdownTextEditor.svelte';

	let { item = $bindable<Item>() }: ContentComponentProps = $props();
</script>

<div
	class={[
		'prose dark:prose-invert prose-sm prose-a:no-underline prose-a:text-accent-600 dark:prose-a:text-accent-400 accent:prose-a:text-accent-950 accent:prose-a:underline accent:prose-p:text-base-900 hover:bg-base-500/20 prose-p:first:mt-0 prose-p:last:mb-0 h-full overflow-y-scroll rounded-md p-2 inline-flex w-full',
		textAlignClasses[item.cardData.textAlign as string],
		verticalAlignClasses[item.cardData.verticalAlign as string]
	]}
>
	<MarkdownTextEditor bind:item />
</div>
