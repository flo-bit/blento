<script lang="ts">
	import type { Item } from '$lib/types';
	import { textAlignClasses, textSizeClasses, verticalAlignClasses } from '.';
	import type { ContentComponentProps } from '../../types';
	import PlainTextEditor from '$lib/components/PlainTextEditor.svelte';

	let { item = $bindable<Item>() }: ContentComponentProps = $props();
</script>

<div
	class={[
		'line-clamp-1 inline-flex h-full w-full rounded-md px-4 py-2 font-semibold',
		textAlignClasses[item.cardData.textAlign as string],
		verticalAlignClasses[item.cardData.verticalAlign ?? ('center' as string)],
		textSizeClasses[(item.cardData.textSize ?? 1) as number]
	]}
>
	<PlainTextEditor bind:contentDict={item.cardData} key="text" class="line-clamp-1 w-full" />
</div>
