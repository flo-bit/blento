<script lang="ts">
	import type { QuotedPostData } from '..';
	import { sanitize } from '$lib/sanitize';
	import Images from './Images.svelte';
	import External from './External.svelte';
	import Video from './Video.svelte';

	const { record }: { record: QuotedPostData } = $props();
</script>

<div
	class="border-base-300 dark:border-base-600/30 bg-base-950/5 dark:bg-base-950/20 overflow-hidden rounded-2xl border text-sm"
>
	<div class="p-3">
		<div class="flex items-center gap-2">
			{#if record.author.avatar}
				<img src={record.author.avatar} alt="" class="size-5 rounded-full object-cover" />
			{/if}
			<div class="flex items-baseline gap-1.5 overflow-hidden text-xs">
				{#if record.author.displayName}
					<span class="text-base-900 dark:text-base-50 truncate font-semibold">
						{record.author.displayName}
					</span>
				{/if}
				<span class="text-base-500 dark:text-base-400 truncate">
					@{record.author.handle}
				</span>
			</div>
		</div>
		{#if record.htmlContent}
			<div class="text-base-800 dark:text-base-200 accent:text-base-900 mt-1.5 line-clamp-3">
				{@html sanitize(record.htmlContent, { ADD_ATTR: ['target'] })}
			</div>
		{/if}
	</div>
	{#if record.embed}
		<div class="px-3 pb-3">
			{#if record.embed.type === 'images'}
				<Images data={record.embed} />
			{:else if record.embed.type === 'external' && record.embed.external}
				<External data={record.embed} />
			{:else if record.embed.type === 'video' && record.embed.video}
				<Video data={record.embed} />
			{/if}
		</div>
	{/if}
</div>
