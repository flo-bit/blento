<script lang="ts">
	import { platformsData } from '.';
	import type { ContentComponentProps } from '../types';

	let { item }: ContentComponentProps = $props();

	const platform = $derived(item.cardData.platform as string);
</script>

<a
	href={item.cardData.href}
	target="_blank"
	rel="noopener noreferrer"
	class="flex h-full w-full items-center justify-center p-10"
	style={`background-color: #${item.cardData.color}`}
>
	<div
		class="flex aspect-square max-h-full max-w-full items-center justify-center [&_svg]:size-full [&_svg]:max-w-60 [&_svg]:fill-white"
	>
		{@html platformsData[platform].svg}
	</div>
</a>
