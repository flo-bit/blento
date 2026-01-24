<script lang="ts">
	import { browser } from '$app/environment';
	import { getImage } from '$lib/helper';
	import { getDidContext, getIsMobile } from '$lib/website/context';
	import type { ContentComponentProps } from '../types';
	import PlainTextEditor from '../utils/PlainTextEditor.svelte';

	let { item = $bindable() }: ContentComponentProps = $props();

	let isMobile = getIsMobile();

	let faviconHasError = $state(false);
	let isFetchingMetadata = $state(false);

	let hasFetched = $derived(item.cardData.hasFetched !== false);

	async function fetchMetadata() {
		let domain: string;
		try {
			domain = new URL(item.cardData.href).hostname;
		} catch {
			return;
		}
		item.cardData.domain = domain;
		faviconHasError = false;

		try {
			const response = await fetch('/api/links?link=' + encodeURIComponent(item.cardData.href));
			if (!response.ok) {
				throw new Error();
			}
			const data = await response.json();
			item.cardData.description = data.description || '';
			item.cardData.title = data.title || '';
			item.cardData.image = data.images?.[0] || '';
			item.cardData.favicon = data.favicons?.[0] || undefined;
		} catch {
			return;
		}
	}

	$effect(() => {
		if (hasFetched !== false || isFetchingMetadata) {
			return;
		}

		isFetchingMetadata = true;

		fetchMetadata().then(() => {
			item.cardData.hasFetched = true;
			isFetchingMetadata = false;
		});
	});

	let did = getDidContext();
</script>

<div class="relative flex h-full flex-col justify-between p-4">
	<div
		class={[
			'accent:bg-accent-500/50 absolute inset-0 z-20 bg-white/50 dark:bg-black/50',
			!hasFetched ? 'animate-pulse' : 'hidden'
		]}
	></div>

	<div class={isFetchingMetadata ? 'pointer-events-none' : ''}>
		<div
			class="bg-base-100 border-base-300 accent:bg-accent-100/50 accent:border-accent-200 dark:border-base-800 dark:bg-base-900 mb-2 inline-flex size-8 items-center justify-center rounded-xl border"
		>
			{#if hasFetched && item.cardData.favicon && !faviconHasError}
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
						d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 1 1.242 7.244"
					/>
				</svg>
			{/if}
		</div>

		<div
			class={[
				'-m-1 rounded-md p-1 transition-colors duration-200',
				hasFetched
					? 'hover:bg-base-200/70 dark:hover:bg-base-800/70 accent:hover:bg-accent-200/30'
					: ''
			]}
		>
			{#if hasFetched}
				<PlainTextEditor
					class="text-base-900 dark:text-base-50 line-clamp-2 text-lg font-bold"
					key="title"
					bind:item
					placeholder="Title here"
				/>
			{:else}
				<span class="text-base-900 dark:text-base-50 line-clamp-2 text-lg font-bold">
					Loading data...
				</span>
			{/if}
		</div>
		<!-- <div class="text-base-800 dark:text-base-100 mt-2 text-xs">{item.cardData.description}</div> -->
		<div
			class="text-accent-600 accent:text-accent-950 dark:text-accent-400 mt-2 text-xs font-semibold"
		>
			{item.cardData.domain}
		</div>
	</div>

	{#if hasFetched && browser && ((isMobile() && item.mobileH >= 8) || (!isMobile() && item.h >= 4)) && item.cardData.image}
		<img
			class="mb-2 aspect-2/1 w-full rounded-xl object-cover opacity-100 transition-opacity duration-100 starting:opacity-0"
			src={getImage(item.cardData, did)}
			alt=""
		/>
	{/if}
</div>
