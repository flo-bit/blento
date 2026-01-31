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
	import { getCDNImageBlobUrl, parseUri } from '$lib/atproto';

	import { ImageMasonry } from '@foxui/visual';

	interface PhotoItem {
		uri: string;
		value: {
			photo: { $type: 'blob'; ref: { $link: string } };
			aspectRatio: { width: number; height: number };
			position?: number;
		};
	}

	let { item }: { item: Item } = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let feed = $state(
		(data[item.cardType] as Record<string, PhotoItem[]> | undefined)?.[item.cardData.galleryUri]
	);

	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		console.log(feed);
		if (!feed) {
			feed = (
				(await CardDefinitionsByType[item.cardType]?.loadData?.([item], {
					did,
					handle
				})) as Record<string, PhotoItem[]> | undefined
			)?.[item.cardData.galleryUri];

			console.log(feed);

			data[item.cardType] = feed;
		}
	});

	let images = $derived(
		(feed
			?.toSorted((a: PhotoItem, b: PhotoItem) => {
				return (a.value.position ?? 0) - (b.value.position ?? 0);
			})
			.map((i: PhotoItem) => {
				const item = parseUri(i.uri);
				return {
					src: getCDNImageBlobUrl({ did: item?.repo, blob: i.value.photo }),
					name: '',
					width: i.value.aspectRatio.width,
					height: i.value.aspectRatio.height,
					position: i.value.position ?? 0
				};
			})
			.filter((i) => i.src !== undefined) || []) as {
			src: string;
			name: string;
			width: number;
			height: number;
			position: number;
		}[]
	);

	let isMobile = getIsMobile();
</script>

<div class="z-10 flex h-full w-full flex-col gap-4 overflow-y-scroll p-4">
	<ImageMasonry
		images={images ?? []}
		showNames={false}
		maxColumns={!isMobile() && item.w > 4 ? 3 : 2}
	/>
</div>
