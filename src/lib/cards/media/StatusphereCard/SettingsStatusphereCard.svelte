<script lang="ts">
	import type { Item } from '$lib/types';
	import { getAdditionalUserData } from '$lib/website/context';
	import { EmojiPicker } from '@foxui/social';

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let record = $state(data[item.cardType] as any);
</script>

<EmojiPicker
	onpicked={(emoji) => {
		record.value.status = emoji.unicode;
		data[item.cardType] = { value: { status: emoji.unicode } };

		item.cardData.hasUpdate = true;
		item.cardData.emoji = emoji.unicode;
	}}
/>
