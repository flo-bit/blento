<script lang="ts">
	import { validateLink } from '$lib/helper';
	import type { Item } from '$lib/types';
	import { Button, Checkbox, Input, Label, toast } from '@foxui/core';

	let { item, onclose }: { item: Item; onclose: () => void } = $props();

	let linkValue = $derived(item.cardData.href.replace('https://', '').replace('http://', ''));

	function updateLink() {
		if (!linkValue.trim()) return;

		let link = validateLink(linkValue);
		if (!link) {
			toast.error('Invalid link');
			return;
		}

		item.cardData.href = link;
		item.cardData.domain = new URL(link).hostname;
		item.cardData.hasFetched = false;

		onclose?.();
	}
</script>

<Input
	spellcheck={false}
	type="url"
	bind:value={linkValue}
	onkeydown={(event) => {
		if (event.code === 'Enter') {
			updateLink();
			event.preventDefault();
		}
	}}
	placeholder="Enter link"
/>
<Button onclick={updateLink} size="icon"
	><svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke-width="1.5"
		stroke="currentColor"
		class="size-6"
	>
		<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
	</svg>
</Button>
<div class="flex items-center space-x- mt-4">
	<Checkbox
		bind:checked={
			() => Boolean(item.cardData.showBackgroundImage),
			(val) => (item.cardData.showBackgroundImage = val)
		}
		id="show-bg-image"
		aria-labelledby="show-bg-image-label"
		variant="secondary"
	/>
	<Label
		id="show-bg-image-label"
		for="show-bg-image"
		class="text-sm leading-none ml-2 font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
	>
		Show background image
	</Label>
</div>
