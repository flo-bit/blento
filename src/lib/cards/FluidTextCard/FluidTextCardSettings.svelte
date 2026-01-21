<script lang="ts">
	import type { Item } from '$lib/types';
	import type { ContentComponentProps } from '../types';
	import { Input, Label } from '@foxui/core';

	let { item = $bindable<Item>() }: ContentComponentProps = $props();

	// Initialize fontSize if not set
	if (item.cardData.fontSize === undefined) {
		item.cardData.fontSize = 0.33;
	}

	const displayPercent = $derived(Math.round((parseFloat(item.cardData.fontSize) as number) * 100));
</script>

<div class="flex flex-col gap-3">
	<div>
		<Label class="mb-1 text-xs">Text</Label>
		<Input bind:value={item.cardData.text} placeholder="Enter text" class="w-full" />
	</div>

	<div>
		<Label class="mb-1 text-xs">Font Size ({displayPercent}%)</Label>
		<input
			type="range"
			min="0.1"
			max="0.8"
			step="0.01"
			value={parseFloat(item.cardData.fontSize) ?? 0.33}
			oninput={(e) => {
				item.cardData.fontSize = e.currentTarget.value.toString();
			}}
			class="bg-base-200 dark:bg-base-700 h-2 w-full cursor-pointer appearance-none rounded-lg"
		/>
	</div>
</div>
