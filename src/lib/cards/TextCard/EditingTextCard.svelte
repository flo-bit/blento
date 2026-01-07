<script lang="ts">
	import type { Item } from '$lib/types';
	import type { ContentComponentProps } from '../types';
	import MarkdownTextEditor from '../utils/MarkdownTextEditor.svelte';

	let { item = $bindable<Item>() }: ContentComponentProps = $props();
</script>

<div
	class="prose dark:prose-invert prose-base prose-a:no-underline prose-a:text-accent-600 dark:prose-a:text-accent-400 prose-sm hover:bg-base-500/20 prose-p:first:mt-0 prose-p:last:mb-0 m-1 max-h-full overflow-y-scroll rounded-md p-1"
>
	<MarkdownTextEditor bind:item />
</div>
