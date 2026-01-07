<script lang="ts">
	import { marked } from 'marked';
	import type { ContentComponentProps } from '../types';

	let { item }: ContentComponentProps = $props();

	const renderer = new marked.Renderer();
	renderer.link = ({ href, title, text }) =>
		`<a target="_blank" href="${href}" title="${title}">${text}</a>`;
</script>

<div
	class="prose dark:prose-invert prose-base prose-a:no-underline prose-a:text-accent-600 dark:prose-a:text-accent-400 prose-sm prose-p:first:mt-0 prose-p:last:mb-0 m-1 max-h-full overflow-y-scroll rounded-md p-1 break-words"
>
	{@html marked.parse(item.cardData.text ?? '', { renderer })}
</div>
