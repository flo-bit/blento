<script lang="ts">
	import { onMount } from 'svelte';
	import 'leaflet/dist/leaflet.css';
	import type { Item } from '$lib/types';

	let { item }: { item: Item } = $props();

	let lMap;
	let leaflet;

	let map: HTMLElement | undefined = $state();

	function getCSSVar(variable: string) {
		return getComputedStyle(document.body).getPropertyValue(variable).trim();
	}

	onMount(async () => {
		try {
			// @ts-expect-error it's like this!
			leaflet = await import('leaflet');

			const location = [parseFloat(item.cardData.lat), parseFloat(item.cardData.lon)];

			lMap = leaflet
				.map(map, {
					zoomControl: false,
					dragging: false,
					minZoom: 2,
					maxZoom: 5
				})
				.setView(location, 3.5);
			leaflet
				.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution:
						'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
				})
				.addTo(lMap);

			let color =
				!item.color || item.color === 'transparent' || item.color === 'base'
					? 'accent'
					: item.color;

			const computedColor = getCSSVar(`--color-${color}-500`);

			leaflet
				.circle(location, {
					color: computedColor,
					fillColor: computedColor,
					fillOpacity: 0.5,
					radius: 100000,
					class: '!grayscale-0'
				})
				.addTo(lMap);
		} catch (err) {
			console.error(`Something went wrong trying to get the geolocation data`, err);
		}
	});
</script>

<div
	bind:this={map}
	class={[
		'absolute inset-0 isolate h-full w-full pointer-coarse:pointer-events-none',
		item.color && item.color !== 'base' && item.color !== 'transparent' ? 'mix-blend-multiply' : ''
	]}
></div>

<style>
	:global(:not(.dark)) :global(.leaflet-layer) {
		filter: grayscale(100%);
	}
	:global(.dark) :global(.leaflet-layer) {
		filter: grayscale(100%) invert(100%);
	}
</style>
