<script lang="ts">
	import type { ContentComponentProps } from '../types';
	import { cn } from '@foxui/core';
	import { getDidContext } from '$lib/website/context';
	import { SvelteMap } from 'svelte/reactivity';

	let { item }: ContentComponentProps = $props();

	const did = getDidContext();

	type Sound = {
		name: string;
		url?: string;
		blob?: {
			$type: 'blob';
			ref: { $link: string };
			mimeType: string;
		};
	};

	let sounds = $derived<Sound[]>(item.cardData?.sounds ?? []);

	let playingIndex = $state<number | null>(null);
	let preloadedAudio = new SvelteMap<number, HTMLAudioElement>();

	function getSoundUrl(sound: Sound): string {
		if (sound.url) return sound.url;
		if (sound.blob && did) {
			return `https://bsky.social/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${sound.blob.ref.$link}`;
		}
		return '';
	}

	function preloadSounds() {
		preloadedAudio.clear();
		sounds.forEach((sound, index) => {
			const url = getSoundUrl(sound);
			if (url) {
				const audio = new Audio(url);
				audio.preload = 'auto';
				audio.onended = () => {
					if (playingIndex === index) {
						playingIndex = null;
					}
				};
				preloadedAudio.set(index, audio);
			}
		});
	}

	$effect(() => {
		preloadSounds();
	});

	function playSound(index: number) {
		// Stop currently playing sound
		if (playingIndex !== null) {
			const currentAudio = preloadedAudio.get(playingIndex);
			if (currentAudio) {
				currentAudio.pause();
				currentAudio.currentTime = 0;
			}
		}

		// Toggle off if same sound
		if (playingIndex === index) {
			playingIndex = null;
			return;
		}

		// Play the new sound
		const audio = preloadedAudio.get(index);
		if (audio) {
			audio.currentTime = 0;
			playingIndex = index;
			audio.play();
		}
	}

	const gridCols = $derived(() => {
		const count = sounds.length;
		if (count <= 2) return 'grid-cols-1';
		if (count <= 6) return 'grid-cols-2';
		if (count <= 12) return 'grid-cols-3';
		return 'grid-cols-4';
	});
</script>

<div class="flex h-full w-full flex-col gap-2 overflow-hidden p-3">
	{#if sounds.length === 0}
		<div
			class="text-base-500 dark:text-base-400 accent:text-base-800/50 flex h-full w-full items-center justify-center"
		>
			No sounds yet
		</div>
	{:else}
		<div class={cn('grid h-full w-full gap-3', gridCols())}>
			{#each sounds as sound, i (sound.name + i)}
				<button
					onclick={() => playSound(i)}
					class={cn(
						'@container/btn flex items-center justify-center rounded-2xl px-2 py-3 font-medium transition-all',
						'bg-base-200 hover:bg-base-300 dark:bg-base-700 dark:hover:bg-base-600',
						'accent:bg-base-900/20 accent:hover:bg-base-900/30',
						'text-base-800 dark:text-base-200 accent:text-base-900',
						playingIndex === i && 'ring-accent-500 ring-2 ring-offset-1'
					)}
				>
					<span
						class="line-clamp-2 text-center break-words text-base @[80px]/btn:text-lg @[100px]/btn:text-xl @[120px]/btn:text-2xl @[150px]/btn:text-3xl @[180px]/btn:text-4xl @[220px]/btn:text-5xl @[280px]/btn:text-6xl @[350px]/btn:text-7xl @[450px]/btn:text-8xl"
						>{sound.name}</span
					>
				</button>
			{/each}
		</div>
	{/if}
</div>
