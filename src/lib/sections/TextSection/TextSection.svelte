<script lang="ts">
	import { marked } from 'marked';
	import { sanitize } from '$lib/sanitize';
	import { cn } from '@foxui/core';
	import type { SectionContentProps } from '../types';
	import { textAlignClasses, textSizeClasses } from './shared';

	let { section }: SectionContentProps = $props();

	let d = $derived(section.sectionData);

	const renderer = new marked.Renderer();
	renderer.link = ({ href, title, text }) =>
		`<a target="_blank" href="${href}" title="${title ?? ''}">${text}</a>`;
</script>

<div class="@container/grid relative col-span-3 px-4 py-10">
	<div
		class={cn(
			'prose dark:prose-invert prose-neutral prose-a:no-underline prose-a:text-accent-600 dark:prose-a:text-accent-400 mx-auto max-w-3xl',
			textAlignClasses?.[d.textAlign as string] ?? 'text-left',
			textSizeClasses[(d.textSize ?? 1) as number]
		)}
	>
		{@html sanitize(marked.parse(d.text ?? '', { renderer }) as string, { ADD_ATTR: ['target'] })}
	</div>
</div>
