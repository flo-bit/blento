<script lang="ts">
	import type { Item } from '$lib/types';
	import { Input } from '@foxui/core';

	let { item }: { item: Item; onclose: () => void } = $props();
</script>

<Input type="password" bind:value={item.cardData.password} placeholder="Enter password" />
