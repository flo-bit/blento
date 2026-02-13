<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getIsMobile } from '$lib/website/context';
	import { getCDNImageBlobUrl, parseUri } from '$lib/atproto';
	import { loadGrainGalleryData } from './helpers';

	import { ImageMasonry } from '@foxui/visual';
	import { openImageViewer } from '$lib/components/image-viewer/imageViewer.svelte';

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

	onMount(async () => {
		if (!feed) {
			feed = ((await loadGrainGalleryData([item])) as Record<string, PhotoItem[]> | undefined)?.[
				item.cardData.galleryUri
			];

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
				const src = getCDNImageBlobUrl({ did: item?.repo, blob: i.value.photo });
				return {
					src,
					name: '',
					width: i.value.aspectRatio.width,
					height: i.value.aspectRatio.height,
					position: i.value.position ?? 0,
					onclick: src ? () => openImageViewer(src) : undefined
				};
			})
			.filter((i) => i.src !== undefined) || []) as {
			src: string;
			name: string;
			width: number;
			height: number;
			position: number;
			onclick?: () => void;
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
