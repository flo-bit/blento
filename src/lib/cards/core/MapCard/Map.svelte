<script lang="ts">
	import type { Item } from '$lib/types';
	import { MapLibre, Projection, Marker } from 'svelte-maplibre-gl';

	let { item = $bindable() }: { item: Item } = $props();

	let center = $state({ lng: parseFloat(item.cardData.lon), lat: parseFloat(item.cardData.lat) });
</script>

<div class="absolute inset-0 isolate h-full w-full">
	<MapLibre
		class="h-full w-full"
		style="https://tiles.openfreemap.org/styles/liberty"
		zoom={item.cardData.zoom}
		{center}
		attributionControl={{ compact: true }}
		dragPan={false}
		dragRotate={false}
		keyboard={false}
		touchZoomRotate={true}
		scrollZoom={true}
		boxZoom={false}
		pitchWithRotate={false}
		touchPitch={false}
	>
		<Projection type={'globe'} />

		<Marker bind:lnglat={center}>
			{#snippet content()}
				<div class="from-accent-400 size-10 rounded-full bg-radial via-transparent p-3">
					<div class="bg-accent-500 size-4 rounded-full ring-2 ring-white"></div>
				</div>
			{/snippet}
		</Marker>
	</MapLibre>
</div>
