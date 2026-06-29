<script lang="ts">
	import Hls from 'hls.js';
	import { getDidContext } from '$lib/website/data/context';
	import { qrOverlay } from '$lib/components/qr/qrOverlay.svelte';
	import type { ContentComponentProps } from '../../types';
	import { videoPlaylistUrl, videoThumbnailUrl } from './upload';

	let { item = $bindable(), isEditing }: ContentComponentProps = $props();

	const did = getDidContext();

	let element = $state<HTMLVideoElement>();

	// Local preview while a freshly dropped/picked file hasn't been uploaded yet.
	const objectUrl = $derived(item.cardData.objectUrl as string | undefined);
	const cid = $derived(item.cardData.video?.ref?.$link as string | undefined);
	const playlist = $derived(!objectUrl && cid ? videoPlaylistUrl(did, cid) : undefined);
	const thumbnail = $derived(cid ? videoThumbnailUrl(did, cid) : undefined);

	// Attach the HLS stream once the <video> element and playlist are available.
	// hls.js handles browsers without native HLS; Safari plays the playlist directly.
	$effect(() => {
		const el = element;
		if (!el || !playlist) return;

		el.muted = true;

		if (Hls.isSupported()) {
			const hls = new Hls();
			hls.loadSource(playlist);
			hls.attachMedia(el);
			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				el.muted = true;
				el.play().catch(() => {});
			});
			return () => hls.destroy();
		} else if (el.canPlayType('application/vnd.apple.mpegurl')) {
			el.src = playlist;
			const onCanPlay = () => {
				el.muted = true;
				el.play().catch(() => {});
			};
			el.addEventListener('canplay', onCanPlay);
			return () => el.removeEventListener('canplay', onCanPlay);
		}
	});
</script>

{#if objectUrl}
	<video
		src={objectUrl}
		muted
		loop
		autoplay
		playsinline
		aria-label={item.cardData.alt ?? 'Video'}
		class={[
			'absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-in-out',
			item.cardData.href ? 'group-hover/card:scale-101' : ''
		]}
	></video>
{:else if playlist}
	{#key playlist}
		<video
			bind:this={element}
			muted
			loop
			autoplay
			playsinline
			poster={thumbnail}
			aria-label={item.cardData.alt ?? 'Video'}
			class={[
				'absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-in-out',
				item.cardData.href ? 'group-hover/card:scale-101' : ''
			]}
		></video>
	{/key}
{:else}
	<div class="text-base-400 absolute inset-0 flex items-center justify-center text-sm">
		No video
	</div>
{/if}

{#if item.cardData.href && !isEditing}
	<a
		href={item.cardData.href}
		class="absolute inset-0 z-50 h-full w-full"
		target="_blank"
		rel="noopener noreferrer"
		use:qrOverlay={{ context: { title: item.cardData.hrefText ?? 'Learn more' } }}
	>
		<span class="sr-only">{item.cardData.hrefText ?? 'Learn more'}</span>

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
