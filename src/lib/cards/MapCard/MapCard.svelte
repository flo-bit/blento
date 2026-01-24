<script lang="ts">
	import type { ContentComponentProps } from '../types';
	import Map from './Map.svelte';

	let { item = $bindable(), isEditing }: ContentComponentProps = $props();
</script>

<Map bind:item />

{#if item.cardData.linkToGoogleMaps && !isEditing}
	<a
		target="_blank"
		rel="noopener noreferrer"
		href={'http://maps.google.com/maps?q=' +
			encodeURIComponent(item.cardData.lat + ',' + item.cardData.lon)}
	>
		<div class="absolute inset-0 z-100"></div>
		<span class="sr-only">open map</span>
	</a>
{/if}
