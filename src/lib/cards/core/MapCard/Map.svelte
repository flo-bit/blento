<script lang="ts">
	import type { Item } from '$lib/types';
	import { MapLibre, Projection, Marker } from 'svelte-maplibre-gl';

	let { item = $bindable() }: { item: Item } = $props();

	let center = $state({ lng: parseFloat(item.cardData.lon), lat: parseFloat(item.cardData.lat) });
	let showAttribution = $state(false);
</script>

<div class="absolute inset-0 isolate h-full w-full">
	<MapLibre
		class="h-full w-full"
		style="https://tiles.openfreemap.org/styles/liberty"
		zoom={item.cardData.zoom}
		{center}
		attributionControl={false}
		dragPan={false}
		dragRotate={false}
		keyboard={false}
		touchZoomRotate={true}
		scrollZoom={true}
		boxZoom={false}
		pitchWithRotate={false}
		touchPitch={false}
	>
		<Projection type="globe" />

		<Marker bind:lnglat={center}>
			{#snippet content()}
				<div class="from-accent-400 size-10 rounded-full bg-radial via-transparent p-3">
					<div class="bg-accent-500 size-4 rounded-full ring-2 ring-white"></div>
				</div>
			{/snippet}
		</Marker>
	</MapLibre>

	{#snippet infoIcon()}
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill-rule="evenodd"
			viewBox="0 0 20 20"
		>
			<path
				d="M4 10a6 6 0 1 0 12 0 6 6 0 1 0-12 0m5-3a1 1 0 1 0 2 0 1 1 0 1 0-2 0m0 3a1 1 0 1 1 2 0v3a1 1 0 1 1-2 0"
			/>
		</svg>
	{/snippet}

	{#snippet attributionText()}
		<a
			href="https://openfreemap.org"
			target="_blank"
			rel="noopener noreferrer"
			class="text-black/75 no-underline hover:underline"
			onclick={(e) => e.stopPropagation()}>OpenFreeMap</a
		>
		<a
			href="https://openmaptiles.org"
			target="_blank"
			rel="noopener noreferrer"
			class="text-black/75 no-underline hover:underline"
			onclick={(e) => e.stopPropagation()}>© OpenMapTiles</a
		>
		Data from
		<a
			href="https://www.openstreetmap.org/copyright"
			target="_blank"
			rel="noopener noreferrer"
			class="text-black/75 no-underline hover:underline"
			onclick={(e) => e.stopPropagation()}>OpenStreetMap</a
		>
	{/snippet}

	{#if showAttribution}
		<div
			class="absolute right-2.5 bottom-2.5 z-10 rounded-xl bg-white text-black"
			style="width: calc(100% - 20px); max-width: 12rem;"
		>
			<button
				class="float-right flex size-6 cursor-pointer items-center justify-center rounded-full shadow-[0_0_6px_rgba(59,130,246,0.6)]"
				onclick={() => (showAttribution = false)}
				aria-label="Toggle attribution"
			>
				{@render infoIcon()}
			</button>
			<div class="p-2 text-left text-xs leading-snug text-black/75">
				{@render attributionText()}
			</div>
		</div>
	{:else}
		<button
			class="absolute right-2.5 bottom-2.5 z-10 flex size-6 items-center justify-center rounded-full bg-white text-black"
			onclick={() => (showAttribution = true)}
			aria-label="Toggle attribution"
		>
			{@render infoIcon()}
		</button>
	{/if}
</div>
