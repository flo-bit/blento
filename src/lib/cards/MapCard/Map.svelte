<script lang="ts">
	import { onMount } from 'svelte';
	import 'mapbox-gl/dist/mapbox-gl.css';
	import mapboxgl from 'mapbox-gl';
	import { env } from '$env/dynamic/public';
	import type { Item } from '$lib/types';
	import { getHexOfCardColor } from '../helper';

	let { item = $bindable() }: { item: Item } = $props();

	$inspect(item);

	let mapContainer: HTMLElement | undefined = $state();
	let map: mapboxgl.Map | undefined = $state();

	onMount(() => {
		if (!mapContainer || !env.PUBLIC_MAPBOX_TOKEN) {
			console.log('no map container or no mapbox token');
			return;
		}

		try {
			mapboxgl.accessToken = env.PUBLIC_MAPBOX_TOKEN;

			const lat = parseFloat(item.cardData.lat);
			const lon = parseFloat(item.cardData.lon);
			const zoom = item.cardData.zoom ? parseFloat(item.cardData.zoom) : 0;
			const lightPreset = item.cardData.lightPreset || 'day';

			map = new mapboxgl.Map({
				container: mapContainer,
				style: 'mapbox://styles/mapbox/standard',
				center: [lon, lat],
				config: {
					basemap: {
						lightPreset: lightPreset,
						showPointOfInterestLabels: false
					}
				},
				zoom: zoom,
				attributionControl: false,
				dragPan: false,
				dragRotate: false,
				keyboard: false,
				doubleClickZoom: true,
				touchZoomRotate: true,
				scrollZoom: true,
				boxZoom: false,
				pitchWithRotate: false,
				touchPitch: false
			});

			// Keep location centered during zoom and save zoom level
			map.on('zoom', () => {
				if (map) {
					map.setCenter([lon, lat]);
				}
			});

			map.on('zoomend', () => {
				if (map) {
					item.cardData.zoom = map.getZoom().toString();
				}
			});

			map.on('load', () => {
				if (!map) return;

				map.resize();
				map.setCenter([lon, lat]);

				const accentColor = getHexOfCardColor(item);

				// Add location point source
				map.addSource('location-point', {
					type: 'geojson',
					data: {
						type: 'Feature',
						geometry: {
							type: 'Point',
							coordinates: [lon, lat]
						},
						properties: {
							name: item.cardData.name || ''
						}
					}
				});

				// Outer glow
				map.addLayer({
					id: 'location-glow-outer',
					type: 'circle',
					source: 'location-point',
					paint: {
						'circle-radius': 20,
						'circle-color': accentColor,
						'circle-opacity': 0.15,
						'circle-blur': 1
					}
				});

				// Middle glow
				map.addLayer({
					id: 'location-glow-middle',
					type: 'circle',
					source: 'location-point',
					paint: {
						'circle-radius': 12,
						'circle-color': accentColor,
						'circle-opacity': 0.3,
						'circle-blur': 0.5
					}
				});

				// White border
				map.addLayer({
					id: 'location-dot-border',
					type: 'circle',
					source: 'location-point',
					paint: {
						'circle-radius': 8,
						'circle-color': '#ffffff',
						'circle-opacity': 1
					}
				});

				// Accent color center dot
				map.addLayer({
					id: 'location-dot',
					type: 'circle',
					source: 'location-point',
					paint: {
						'circle-radius': 6,
						'circle-color': accentColor,
						'circle-opacity': 1
					}
				});
			});

			// Handle container resize
			const resizeObserver = new ResizeObserver(() => {
				if (map) {
					map.resize();
					map.setCenter([lon, lat]);
				}
			});
			if (mapContainer) resizeObserver.observe(mapContainer);

			return () => {
				resizeObserver.disconnect();
				if (map) {
					map.remove();
				}
			};
		} catch (err) {
			console.error(`Something went wrong trying to initialize the map`, err);
		}
	});
</script>

<div bind:this={mapContainer} class="absolute inset-0 isolate h-full w-full"></div>
