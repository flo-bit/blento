<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { CineonToneMapping } from 'three';
	import type { ContentComponentProps } from '../types';
	import Model3DScene from './Model3DScene.svelte';
	import { getDidContext } from '$lib/website/context';
	import { getBlobURL } from '$lib/atproto';
	import type { Did } from '@atcute/lexicons';
	import { onMount } from 'svelte';

	let { item }: ContentComponentProps = $props();

	let isHovering = $state(false);
	let objectUrl = $state<string | undefined>(undefined);
	let isLoading = $state(false);

	const did = getDidContext();

	// Fetch blob from PDS and create object URL (like VideoCard does)
	onMount(async () => {
		if (item.cardData.modelBlob?.$type === 'blob') {
			isLoading = true;
			try {
				const pdsUrl = await getBlobURL({ did: did as Did, blob: item.cardData.modelBlob });
				const response = await fetch(pdsUrl);
				if (!response.ok) throw new Error(response.statusText);
				const blob = await response.blob();
				objectUrl = URL.createObjectURL(blob);
			} catch (e) {
				console.error('Failed to load 3D model:', e);
			} finally {
				isLoading = false;
			}
		}
	});

	// Get the model URL from various sources
	let modelUrl = $derived.by(() => {
		// Local file (during editing before save)
		if (item.cardData.modelFile?.objectUrl) {
			return item.cardData.modelFile.objectUrl;
		}

		// Uploaded blob (after save) - use fetched object URL
		if (item.cardData.modelBlob?.$type === 'blob') {
			return objectUrl;
		}

		return undefined;
	});

	let modelType = $derived(item.cardData.modelFile?.type || item.cardData.modelType || 'gltf') as
		| 'gltf'
		| 'stl'
		| 'fbx';
</script>

<div
	class="absolute inset-0 h-full w-full"
	role="img"
	aria-label="3D model viewer"
	onpointerenter={() => (isHovering = true)}
	onpointerleave={() => (isHovering = false)}
>
	{#if modelUrl}
		<Canvas toneMapping={CineonToneMapping}>
			<Model3DScene path={modelUrl} hover={isHovering} {modelType} />
		</Canvas>
	{:else if isLoading}
		<div class="flex h-full items-center justify-center text-sm opacity-50">Loading model...</div>
	{:else}
		<div class="flex h-full items-center justify-center text-sm opacity-50">No model loaded</div>
	{/if}
</div>
