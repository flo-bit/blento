<script lang="ts">
	import type { Item } from '$lib/types';
	import type { SettingsComponentProps } from '../../types';
	import { Input, Label } from '@foxui/core';

	let { item = $bindable<Item>() }: SettingsComponentProps = $props();

	type RecordVisualizerCardData = {
		emoji?: string;
		collection?: string;
		direction?: 'down' | 'up';
		speed?: number;
	};

	let cardData = $derived(item.cardData as RecordVisualizerCardData);

	// Initialize defaults if not set
	if (item.cardData.emoji === undefined) {
		item.cardData.emoji = '💙';
	}
	if (item.cardData.collection === undefined) {
		item.cardData.collection = 'app.bsky.feed.like';
	}
	if (item.cardData.direction === undefined) {
		item.cardData.direction = 'down';
	}
	if (item.cardData.speed === undefined) {
		item.cardData.speed = 1;
	}
</script>

<div class="flex flex-col gap-3">
	<div>
		<Label class="mb-1 text-xs">Emoji</Label>
		<Input bind:value={item.cardData.emoji} placeholder="💙" class="w-full" />
	</div>

	<div>
		<Label class="mb-1 text-xs">Collection</Label>
		<Input bind:value={item.cardData.collection} placeholder="app.bsky.feed.like" class="w-full" />
	</div>

	<div>
		<Label class="mb-1 text-xs">Direction</Label>
		<select
			value={cardData.direction ?? 'down'}
			onchange={(e) => {
				item.cardData.direction = (e.target as HTMLSelectElement).value;
			}}
			class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-600 w-full rounded-md border px-3 py-2 text-sm"
		>
			<option value="down">Down</option>
			<option value="up">Up</option>
		</select>
	</div>

	<div>
		<Label class="mb-1 text-xs">Speed ({cardData.speed?.toFixed(1) ?? '1.0'}x)</Label>
		<input
			type="range"
			min="0.5"
			max="2"
			step="0.1"
			value={cardData.speed ?? 1}
			oninput={(e) => {
				item.cardData.speed = parseFloat(e.currentTarget.value);
			}}
			class="bg-base-200 dark:bg-base-700 h-2 w-full cursor-pointer appearance-none rounded-lg"
		/>
	</div>
</div>
