<script lang="ts">
	import { marked } from 'marked';
	import type { ContentComponentProps } from '../types';
	import { textAlignClasses, verticalAlignClasses } from '.';

	let { item }: ContentComponentProps = $props();

	const renderer = new marked.Renderer();
	renderer.link = ({ href, title, text }) =>
		`<a target="_blank" href="${href}" title="${title}">${text}</a>`;
</script>

<div
	class={[
		'prose dark:prose-invert prose-sm prose-a:no-underline prose-a:text-accent-600 dark:prose-a:text-accent-400 accent:prose-a:text-accent-950 accent:prose-a:underline accent:prose-p:text-base-900 prose-p:first:mt-0 prose-p:last:mb-0 inline-flex h-full w-full overflow-y-scroll rounded-md p-3',
		textAlignClasses?.[item.cardData.textAlign as string],
		verticalAlignClasses[item.cardData.verticalAlign as string]
	]}
>
	<span>{@html marked.parse(item.cardData.text ?? '', { renderer })}</span>
</div>
