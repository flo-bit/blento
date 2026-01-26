<script lang="ts">
	import { browser } from '$app/environment';
	import { getImage } from '$lib/helper';
	import { getDidContext, getIsMobile } from '$lib/website/context';
	import type { ContentComponentProps } from '../types';
	import { qrOverlay } from '$lib/components/qr/qrOverlay.svelte';

	let { item, isEditing }: ContentComponentProps = $props();

	let isMobile = getIsMobile();

	let faviconHasError = $state(false);

	let did = getDidContext();
</script>

<div class="flex h-full flex-col justify-between p-4">
	<div>
		<div
			class="bg-base-100 border-base-300 accent:bg-accent-100/50 accent:border-accent-200 dark:border-base-800 dark:bg-base-900 mb-2 inline-flex size-8 items-center justify-center rounded-xl border"
		>
			{#if item.cardData.favicon && !faviconHasError}
				<img
					class="size-6 rounded-lg object-cover"
					onerror={() => (faviconHasError = true)}
					src={getImage(item.cardData, did, 'favicon')}
					alt=""
				/>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="size-4"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
					/>
				</svg>
			{/if}
		</div>
		<div
			class={[
				'text-base-900 dark:text-base-50 text-lg font-bold',
				(isMobile() && item.mobileH < 8) || (!isMobile() && item.h < 4) ? 'line-clamp-2' : ''
			]}
		>
			{item.cardData.title}
		</div>
		<!-- <div class="text-base-800 dark:text-base-100 mt-2 text-xs">{item.cardData.description}</div> -->
		<div
			class="text-accent-600 accent:text-accent-950 dark:text-accent-400 mt-2 text-xs font-semibold"
		>
			{item.cardData.domain}
		</div>
	</div>

	{#if browser && ((isMobile() && item.mobileH >= 8) || (!isMobile() && item.h >= 4)) && item.cardData.image}
		<img
			class="mb-2 aspect-2/1 w-full rounded-xl object-cover opacity-100 transition-opacity duration-100 starting:opacity-0"
			src={getImage(item.cardData, did)}
			alt=""
		/>
	{/if}
	{#if item.cardData.href && !isEditing}
		<a
			href={item.cardData.href}
			class="absolute inset-0 h-full w-full"
			target="_blank"
			rel="noopener noreferrer"
			use:qrOverlay={{
				context: {
					title: item.cardData.title
				}
			}}
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
</div>
