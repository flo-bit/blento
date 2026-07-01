<script lang="ts" module>
	export const videoPlayer: {
		id: string | undefined;

		show: (id: string) => void;
		hide: () => void;
	} = $state({
		id: undefined,

		show: (id: string) => {
			videoPlayer.id = id;
		},

		hide: () => {
			videoPlayer.id = undefined;
		}
	});
</script>

<script lang="ts">
	import { cn } from '@foxui/core';
	import { onDestroy, onMount } from 'svelte';

	// Minimal Plyr interface for what we use
	interface PlyrInstance {
		source: {
			type: string;
			sources: { src: string; type: string }[];
		};
		on: (event: string, callback: () => void) => void;
		play: () => void;
		destroy: () => void;
	}

	interface PlyrConstructorType {
		new (selector: string, options: Record<string, unknown>): PlyrInstance;
	}

	const { class: className }: { class?: string } = $props();

	let PlyrConstructor: PlyrConstructorType | undefined = $state();

	let player: PlyrInstance | undefined = $state();

	onMount(async () => {
		if (!PlyrConstructor) {
			const plyrModule = (await import('plyr')) as unknown as { default: PlyrConstructorType };
			PlyrConstructor = plyrModule.default;
		}

		player = new PlyrConstructor('.js-player', {
			settings: ['captions', 'quality', 'loop', 'speed'],
			controls: [
				'play-large',
				'play',
				'progress',
				'current-time',
				'volume',
				'settings',
				'download',
				'fullscreen'
			]
		});

		// set the video player to the id
		if (videoPlayer.id) {
			player.source = {
				type: 'video',
				sources: [
					{
						src: videoPlayer.id,
						type: 'video/youtube'
					}
				]
			};
		}

		// when loaded play the video and go fullscreen
		player.on('ready', () => {
			player?.play();
			//player.fullscreen.enter();
		});
	});

	onDestroy(() => {
		player?.destroy();
	});

	let glow = 50;
</script>

<svelte:head>
	{#if videoPlayer.id}
		<link rel="stylesheet" href="https://cdn.plyr.io/3.7.8/plyr.css" />
	{/if}
</svelte:head>

<svelte:window
	onkeydown={(e) => {
		if (e.key === 'Escape') {
			videoPlayer.hide();
		}
	}}
/>

{#key videoPlayer.id}
	{#if videoPlayer.id}
		<div class="fixed inset-0 z-100 flex h-screen w-screen items-center justify-center">
			<button
				onclick={() => videoPlayer.hide()}
				class="absolute inset-0 bg-black/70 backdrop-blur-sm"
			>
				<span class="sr-only">Close</span>
			</button>

			<div
				class={cn(
					'relative mx-4 aspect-video max-h-screen w-full overflow-hidden rounded-xl border border-black bg-white object-cover sm:mx-20 dark:border-white/10 dark:bg-white/5',
					className
				)}
				style="filter: url(#blur); width: 100%;"
			>
				<div class="">
					<div
						id="player"
						class="h-full w-full overflow-hidden rounded-xl object-cover font-semibold text-black dark:text-white"
					>
						<div
							class="js-player plyr__video-embed"
							id="player"
							data-plyr-provider="youtube"
							data-plyr-embed-id={videoPlayer.id}
						></div>
					</div>
				</div>
			</div>

			<button
				onclick={() => {
					videoPlayer.hide();
				}}
				class="absolute top-2 right-2 z-20 rounded-full border border-white/10 bg-white/5 p-2 backdrop-blur-sm"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="currentColor"
					class="size-6"
				>
					<path
						fill-rule="evenodd"
						d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z"
						clip-rule="evenodd"
					/>
				</svg>

				<span class="sr-only">Close</span>
			</button>
		</div>
	{/if}
{/key}

<svg width="0" height="0">
	<filter id="blur" y="-50%" x="-50%" width="300%" height="300%">
		<feGaussianBlur in="SourceGraphic" stdDeviation={glow} result="blurred" />
		<feColorMatrix type="saturate" in="blurred" values="3" />
		<feComposite in="SourceGraphic" operator="over" />
	</filter>
</svg>

<style>
	* {
		--plyr-color-main: var(--color-accent-500);
	}
</style>
