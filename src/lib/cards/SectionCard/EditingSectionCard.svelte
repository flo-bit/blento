<script lang="ts">
	import type { Item } from '$lib/types';
	import { textAlignClasses, textSizeClasses, verticalAlignClasses } from '.';
	import type { ContentComponentProps } from '../types';
	import PlainTextEditor from '../utils/PlainTextEditor.svelte';

	let { item = $bindable<Item>() }: ContentComponentProps = $props();
</script>

<div
	class={[
		'line-clamp-1 inline-flex h-full w-full rounded-md p-1 px-2 font-semibold',
		textAlignClasses[item.cardData.textAlign as string],
		verticalAlignClasses[item.cardData.verticalAlign ?? ('center' as string)],
		textSizeClasses[(item.cardData.textSize ?? 1) as number]
	]}
>
	<PlainTextEditor bind:item key="text" class="line-clamp-1 w-full" />
</div>
