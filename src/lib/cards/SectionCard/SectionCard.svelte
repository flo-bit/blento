<script lang="ts">
	import { marked } from 'marked';
	import type { ContentComponentProps } from '../types';

	let { item }: ContentComponentProps = $props();

	const renderer = new marked.Renderer();
	renderer.link = ({ href, title, text }) =>
		`<a target="_blank" href="${href}" title="${title}">${text}</a>`;
</script>

<div
	class="line-clamp-1 inline-flex h-full w-full items-center rounded-md p-1 px-2 text-2xl font-semibold"
>
	{item.cardData.text}
</div>
