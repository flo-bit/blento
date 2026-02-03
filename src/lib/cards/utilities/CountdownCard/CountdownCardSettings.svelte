<script lang="ts">
	import type { Item } from '$lib/types';
	import { Input, Label } from '@foxui/core';
	import type { CountdownCardData } from './index';

	let { item }: { item: Item; onclose: () => void } = $props();

	let cardData = $derived(item.cardData as CountdownCardData);

	let targetDateValue = $derived.by(() => {
		if (!cardData.targetDate) return '';
		return new Date(cardData.targetDate).toISOString().split('T')[0];
	});

	let targetTimeValue = $derived.by(() => {
		if (!cardData.targetDate) return '12:00';
		return new Date(cardData.targetDate).toTimeString().slice(0, 5);
	});

	function updateTargetDate(dateStr: string, timeStr: string) {
		if (!dateStr) return;
		item.cardData.targetDate = new Date(`${dateStr}T${timeStr}`).toISOString();
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-col gap-2">
		<Label>Target Date & Time</Label>
		<div class="flex gap-2">
			<Input
				type="date"
				value={targetDateValue}
				onchange={(e) => updateTargetDate(e.currentTarget.value, targetTimeValue)}
				class="flex-1"
			/>
			<Input
				type="time"
				value={targetTimeValue}
				onchange={(e) => updateTargetDate(targetDateValue, e.currentTarget.value)}
				class="w-28"
			/>
		</div>
	</div>
</div>
