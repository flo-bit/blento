<script lang="ts">
	import { browser } from '$app/environment';
	import { getImage, compressImage } from '$lib/helper';
	import { getDidContext, getIsMobile } from '$lib/website/context';
	import type { ContentComponentProps } from '../types';
	import PlainTextEditor from '$lib/components/PlainTextEditor.svelte';

	let { item = $bindable() }: ContentComponentProps = $props();

	let faviconInputRef: HTMLInputElement;
	let imageInputRef: HTMLInputElement;
	let isHoveringFavicon = $state(false);
	let isHoveringImage = $state(false);

	async function handleFaviconChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		try {
			const compressedBlob = await compressImage(file, 128);
			const objectUrl = URL.createObjectURL(compressedBlob);

			item.cardData.favicon = {
				blob: compressedBlob,
				objectUrl
			} as any;

			faviconHasError = false;
		} catch (error) {
			console.error('Failed to process image:', error);
		}
	}

	async function handleImageChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		try {
			const compressedBlob = await compressImage(file);
			const objectUrl = URL.createObjectURL(compressedBlob);

			item.cardData.image = {
				blob: compressedBlob,
				objectUrl
			} as any;
		} catch (error) {
			console.error('Failed to process image:', error);
		}
	}

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

<input
	type="file"
	accept="image/*"
	class="hidden"
	bind:this={faviconInputRef}
	onchange={handleFaviconChange}
/>
<input
	type="file"
	accept="image/*"
	class="hidden"
	bind:this={imageInputRef}
	onchange={handleImageChange}
/>

<div class="relative flex h-full flex-col justify-between p-4">
	<div
		class={[
			'accent:bg-accent-500/50 absolute inset-0 z-20 bg-white/50 dark:bg-black/50',
			!hasFetched ? 'animate-pulse' : 'hidden'
		]}
	></div>

	<div class={isFetchingMetadata ? 'pointer-events-none' : ''}>
		<button
			type="button"
			class="bg-base-100 border-base-300 accent:bg-accent-100/50 accent:border-accent-200 dark:border-base-800 dark:bg-base-900 hover:ring-accent-500 relative mb-2 inline-flex size-8 cursor-pointer items-center justify-center rounded-xl border transition-all duration-200 hover:ring-2"
			onclick={() => faviconInputRef?.click()}
			onmouseenter={() => (isHoveringFavicon = true)}
			onmouseleave={() => (isHoveringFavicon = false)}
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
			<!-- Hover overlay -->
			<div
				class={[
					'absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 transition-opacity duration-200',
					isHoveringFavicon ? 'opacity-100' : 'opacity-0'
				]}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="size-4 text-white"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z"
					/>
				</svg>
			</div>
		</button>

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
					bind:contentDict={item.cardData}
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

	{#if hasFetched && browser && ((isMobile() && item.mobileH >= 8) || (!isMobile() && item.h >= 4))}
		<button
			type="button"
			class="hover:ring-accent-500 relative mb-2 aspect-2/1 w-full cursor-pointer overflow-hidden rounded-xl transition-all duration-200 hover:ring-2"
			onclick={() => imageInputRef?.click()}
			onmouseenter={() => (isHoveringImage = true)}
			onmouseleave={() => (isHoveringImage = false)}
		>
			{#if item.cardData.image}
				<img
					class="h-full w-full object-cover opacity-100 transition-opacity duration-100 starting:opacity-0"
					src={getImage(item.cardData, did)}
					alt=""
				/>
			{:else}
				<div class="bg-base-200 dark:bg-base-800 flex h-full w-full items-center justify-center">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="text-base-400 dark:text-base-600 size-8"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
						/>
					</svg>
				</div>
			{/if}
			<!-- Hover overlay -->
			<div
				class={[
					'absolute inset-0 flex items-center justify-center rounded-xl bg-black/50 transition-opacity duration-200',
					isHoveringImage ? 'opacity-100' : 'opacity-0'
				]}
			>
				<div class="text-center text-sm text-white">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="mx-auto mb-1 size-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
						/>
					</svg>
					<span class="font-medium">{item.cardData.image ? 'Change' : 'Add image'}</span>
				</div>
			</div>
		</button>
	{/if}
</div>
