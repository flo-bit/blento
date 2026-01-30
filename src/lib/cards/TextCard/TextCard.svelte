<script lang="ts">
	import { marked } from 'marked';
	import { sanitize } from '$lib/sanitize';
	import type { ContentComponentProps } from '../types';
	import { textAlignClasses, textSizeClasses, verticalAlignClasses } from '.';
	import { cn } from '@foxui/core';

	let { item }: ContentComponentProps = $props();

	const renderer = new marked.Renderer();
	renderer.link = ({ href, title, text }) =>
		`<a target="_blank" href="${href}" title="${title ?? ''}">${text}</a>`;
</script>

<div
	class={cn(
		'prose dark:prose-invert prose-neutral prose-sm prose-a:no-underline prose-a:text-accent-600 dark:prose-a:text-accent-400 accent:prose-a:text-accent-950 accent:prose-a:underline accent:prose-p:text-base-900 prose-p:first:mt-0 prose-p:last:mb-0 prose-headings:first:mt-0 prose-headings:last:mb-0 inline-flex h-full min-h-full w-full max-w-none overflow-x-hidden overflow-y-scroll rounded-md p-3 text-lg',
		textAlignClasses?.[item.cardData.textAlign as string],
		verticalAlignClasses[item.cardData.verticalAlign as string],
		textSizeClasses[(item.cardData.textSize ?? 0) as number]
	)}
>
	<span
		>{@html sanitize(marked.parse(item.cardData.text ?? '', { renderer }) as string, {
			ADD_ATTR: ['target']
		})}</span
	>
</div>
