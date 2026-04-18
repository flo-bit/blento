<script lang="ts">
	import { ImageMasonry } from '@foxui/visual';
	import { getDidContext } from '$lib/website/context';
	import { getImage } from '$lib/helper';
	import { openImageViewer } from '$lib/components/image-viewer/imageViewer.svelte';
	import type { SectionContentProps } from '../types';

	let { section, items }: SectionContentProps = $props();

	let d = $derived(section.sectionData);
	let columns = $derived(Math.max(1, Math.min(6, (d.columns ?? 3) as number)));

	const did = getDidContext();

	let sectionItems = $derived(
		items.filter((i) => i.sectionId === section.id).toSorted((a, b) => a.x - b.x)
	);

	let images = $derived(
		sectionItems
			.map((item) => {
				const src = getImage(item.cardData, did, 'image');
				if (!src) return null;
				const ar = item.cardData.aspectRatio as { width: number; height: number } | undefined;
				const width = ar?.width || item.w || 1;
				const height = ar?.height || item.h || 1;
				return {
					src,
					name: '',
					width,
					height,
					onclick: () => openImageViewer(src)
				};
			})
			.filter((i) => i !== null)
	);
</script>

<div class="@container/grid relative col-span-3 px-2 py-8">
	<div class="gallery-compact">
		<ImageMasonry {images} showNames={false} maxColumns={2} />
	</div>
	<div class="gallery-wide">
		<ImageMasonry {images} showNames={false} maxColumns={columns} />
	</div>
</div>

<style>
	.gallery-wide {
		display: none;
	}
	@container grid (width >= 42rem) {
		.gallery-compact {
			display: none;
		}
		.gallery-wide {
			display: block;
		}
	}
</style>
