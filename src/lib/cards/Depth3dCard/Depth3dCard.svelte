<script lang="ts">
	import { Depth3D } from '@foxui/3d';
	import type { ContentComponentProps } from '../types';
	import { onMount } from 'svelte';

	let { item }: ContentComponentProps = $props();

	let image = $state(item.cardData.image);
	let depth = $state(item.cardData.depth);

	onMount(async () => {
		if (depth) return;
		if(!image) return;

		const response = await fetch('/api/replicate/depth-image?image=' + image);

		const json = await response.json();

		depth = json.url;

		console.log(depth);
	});

	$inspect(depth);
</script>

{#if image && depth}
	<Depth3D
		class="h-full w-full"
		sceneProps={{
			image: {
				image: '/api/image?image=' + item.cardData.image,
				depth: depth
			},
			rounded: 0,
			detail: 500,
			depthScale: 1.5,
			cameraPosition: [0, 0, 7.5]
		}}
	/>
{/if}
