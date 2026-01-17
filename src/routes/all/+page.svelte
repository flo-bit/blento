<script lang="ts">
	import { createEmptyCard, refreshData } from '$lib/helper.js';
	import Website from '$lib/website/Website.svelte';
	import { onMount } from 'svelte';

	let { data } = $props();

	$inspect(data.profiles);
</script>

<Website
	data={{
		...data,
		cards: data.profiles.map((v, i) => {
			const card = createEmptyCard('');
			card.cardType = 'blueskyProfile';
			card.cardData = {
				avatar: v.avatar,
				handle: v.handle,
				displayName: v.displayName
			};

			card.x = (i % 4) * 2;
			card.y = Math.floor(i / 4) * 2;

			card.mobileX = (i % 2) * 4;
			card.mobileY = Math.floor(i / 2) * 4;

			return card;
		})
	}}
/>
