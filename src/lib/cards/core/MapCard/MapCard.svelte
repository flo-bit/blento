<script lang="ts">
	import type { ContentComponentProps } from '../../types';
	import Map from './Map.svelte';
	import { qrOverlay } from '$lib/components/qr/qrOverlay.svelte';

	let { item = $bindable(), isEditing }: ContentComponentProps = $props();

	const mapsUrl = $derived(
		'https://maps.google.com/maps?q=' +
			encodeURIComponent(item.cardData.lat + ',' + item.cardData.lon)
	);
</script>

<Map bind:item {isEditing} />

{#if item.cardData.linkToGoogleMaps && !isEditing}
	<a
		target="_blank"
		rel="noopener noreferrer"
		href={mapsUrl}
		use:qrOverlay={{ context: { title: 'Google Maps' } }}
	>
		<div class="absolute inset-0 z-100"></div>
		<span class="sr-only">open map</span>
	</a>
{/if}
