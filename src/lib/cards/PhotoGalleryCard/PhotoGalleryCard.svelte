<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import {
		getAdditionalUserData,
		getDidContext,
		getHandleContext,
		getIsMobile
	} from '$lib/website/context';
	import { CardDefinitionsByType } from '..';
	import { getImageBlobUrl, parseUri } from '$lib/oauth/utils';

	import { ImageMasonry } from '@foxui/visual';

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let feed = $state((data[item.cardType] as any)?.[item.cardData.galleryUri]);

	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		console.log(feed);
		if (!feed) {
			feed = (
				(await CardDefinitionsByType[item.cardType]?.loadData?.([item], {
					did,
					handle
				})) as any
			)?.[item.cardData.galleryUri];

			console.log(feed);

			data[item.cardType] = feed;
		}
	});

	let images = $derived(
		feed
			?.toSorted((a, b) => {
				return (a.value.position ?? 0) - (b.value.position ?? 0);
			})
			.map((i) => {
				const { did } = parseUri(i.uri);
				return {
					src: getImageBlobUrl({ did, link: i.value.photo?.ref?.$link }),
					width: i.value.aspectRatio.width,
					height: i.value.aspectRatio.height,
					position: i.value.position ?? 0
				};
			})
	);
	$inspect(images);
	let isMobile = getIsMobile();
</script>

<div class="z-10 flex h-full w-full flex-col gap-4 overflow-y-scroll p-4">
	{#each (feed ?? []).slice(0, 20) as photo}{/each}

	<ImageMasonry
		images={images ?? []}
		showNames={false}
		maxColumns={!isMobile() && item.w > 4 ? 3 : 2}
	/>
</div>
