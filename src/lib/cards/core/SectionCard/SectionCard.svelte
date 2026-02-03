<script lang="ts">
	import { marked } from 'marked';
	import type { ContentComponentProps } from '../../types';
	import { textAlignClasses, textSizeClasses, verticalAlignClasses } from '.';

	let { item }: ContentComponentProps = $props();

	const renderer = new marked.Renderer();
	renderer.link = ({ href, title, text }) =>
		`<a target="_blank" href="${href}" title="${title}">${text}</a>`;
</script>

<div
	class={[
		'line-clamp-1 inline-flex h-full w-full rounded-md p-1 px-2 font-semibold',
		textAlignClasses[item.cardData.textAlign as string],
		verticalAlignClasses[item.cardData.verticalAlign ?? ('center' as string)],
		textSizeClasses[(item.cardData.textSize ?? 1) as number]
	]}
>
	{item.cardData.text}
</div>
