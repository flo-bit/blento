<script lang="ts">
	import { getDidContext } from '$lib/website/context';
	import { getBlobURL } from '$lib/atproto';
	import { onMount } from 'svelte';
	import type { ContentComponentProps } from '../types';

	let { item = $bindable() }: ContentComponentProps = $props();

	const did = getDidContext();

	let element: HTMLVideoElement | undefined = $state();

	onMount(async () => {
		const el = element;
		if (!el) return;

		el.muted = true;

		// If we already have an objectUrl (preview before upload), use it directly
		if (item.cardData.objectUrl) {
			el.src = item.cardData.objectUrl;
			el.play().catch((e) => {
				console.error('Video play error:', e);
			});
			return;
		}

		// Fetch the video blob from the PDS
		if (item.cardData.video?.video && typeof item.cardData.video.video === 'object') {
			try {
				const blobUrl = await getBlobURL({ did, blob: item.cardData.video.video });
				const res = await fetch(blobUrl);
				if (!res.ok) throw new Error(res.statusText);
				const blob = await res.blob();
				const url = URL.createObjectURL(blob);
				el.src = url;
				el.play().catch((e) => {
					console.error('Video play error:', e);
				});
			} catch (e) {
				console.error('Failed to load video:', e);
			}
		}
	});
</script>

{#key item.cardData.video || item.cardData.objectUrl}
	<video
		bind:this={element}
		muted
		loop
		autoplay
		playsinline
		class={[
			'absolute inset-0 h-full w-full object-cover opacity-100 transition-transform duration-300 ease-in-out',
			item.cardData.href ? 'group-hover:scale-102' : ''
		]}
	></video>
{/key}
{#if item.cardData.href}
	<a
		href={item.cardData.href}
		class="absolute inset-0 h-full w-full"
		target="_blank"
		rel="noopener noreferrer"
	>
		<span class="sr-only">
			{item.cardData.hrefText ?? 'Learn more'}
		</span>

		<div
			class="bg-base-800/30 border-base-900/30 absolute top-2 right-2 rounded-full border p-1 text-white opacity-50 backdrop-blur-lg group-focus-within:opacity-100 group-hover:opacity-100"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="2.5"
				stroke="currentColor"
				class="size-4"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
				/>
			</svg>
		</div>
	</a>
{/if}
