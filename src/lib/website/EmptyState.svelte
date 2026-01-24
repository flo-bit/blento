<script lang="ts">
	import { login, user } from '$lib/atproto';
	import BaseCard from '$lib/cards/BaseCard/BaseCard.svelte';
	import Card from '$lib/cards/Card/Card.svelte';
	import type { Item, WebsiteData } from '$lib/types';
	import type { ActorIdentifier } from '@atcute/lexicons';
	import { Button } from '@foxui/core';

	let { data }: { data: WebsiteData } = $props();

	let cards = $derived.by((): Item[] => {
		const items: Item[] = [];

		// Name + "No blento yet" card
		items.push({
			id: 'empty-main',
			x: 0,
			y: 0,
			w: 6,
			h: 2,
			mobileX: 0,
			mobileY: 0,
			mobileW: 8,
			mobileH: 3,
			cardType: 'text',
			color: 'red',
			cardData: {
				text: `## No blento yet!`,
				textAlign: 'center',
				verticalAlign: 'center'
			}
		});

		// Bluesky social icon
		items.push({
			id: 'empty-bluesky',
			x: 0,
			y: 2,
			w: 2,
			h: 2,
			mobileX: 0,
			mobileY: 3,
			mobileW: 3,
			mobileH: 3,
			cardType: 'bigsocial',
			cardData: {
				platform: 'bluesky',
				href: `https://bsky.app/profile/${data.handle}`,
				color: '0285FF'
			}
		});

		return items;
	});

	let maxHeight = $derived(cards.reduce((max, item) => Math.max(max, item.y + item.h), 0));

	let maxMobileHeight = $derived(
		cards.reduce((max, item) => Math.max(max, item.mobileY + item.mobileH), 0)
	);
</script>

{#each cards as item (item.id)}
	<BaseCard {item}>
		<Card {item} />
	</BaseCard>
{/each}

<!-- Spacer for grid height -->
<div class="hidden @[42rem]/grid:block" style="height: {(maxHeight / 8) * 100}cqw;"></div>
<div class="@[42rem]/grid:hidden" style="height: {(maxMobileHeight / 4) * 100}cqw;"></div>

{#if !user.isLoggedIn}
	<div
		class="dark:bg-base-950 border-base-200 dark:border-base-900 fixed top-4 right-4 z-20 flex flex-col gap-4 rounded-2xl border bg-white p-4 shadow-lg"
	>
		<span class="text-sm font-semibold">Login to edit your page</span>

		<Button
			onclick={async () => {
				await login(data.handle as ActorIdentifier);
			}}>Login</Button
		>
	</div>
{/if}
