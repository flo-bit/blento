<script lang="ts">
	import type { ContentComponentProps } from '../types';
	import PlainTextEditor from '$lib/components/PlainTextEditor.svelte';
	import { cn } from '@foxui/core';

	let { item = $bindable() }: ContentComponentProps = $props();
</script>

<div
	class="text-base-950 dark:text-base-50 flex h-full w-full flex-col items-center justify-center gap-2 px-4"
>
	<PlainTextEditor
		key="text"
		bind:contentDict={item.cardData}
		placeholder="Button text"
		class={cn(
			'line-clamp-1 text-center text-2xl font-semibold',
			item.color === 'transparent'
				? 'bg-accent-400 dark:bg-accent-500 hover:bg-accent-400 dark:text-base-950 rounded-2xl px-5 py-2.5 text-xl transition-colors duration-100'
				: ''
		)}
	/>
</div>
