<script lang="ts">
	import { getDidContext } from '$lib/website/context';
	import { getImageBlobUrl } from '$lib/oauth/utils';
	import type { ContentComponentProps } from '../types';

	let { item = $bindable() }: ContentComponentProps = $props();

	const did = getDidContext();

	let isDragging = $state(false);
	let urlInput = $state(item.cardData.url || '');
	let hasError = $state(false);
	let isEditing = $state(false);
	let inputElement: HTMLInputElement | null = $state(null);

	function getSrc() {
		if (item.cardData.objectUrl) return item.cardData.objectUrl;

		if (item.cardData.image && typeof item.cardData.image === 'object') {
			return getImageBlobUrl({ did, link: item.cardData.image?.ref?.$link });
		}

		return item.cardData.url || item.cardData.image;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	async function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;

		const files = e.dataTransfer?.files;
		if (!files || files.length === 0) return;

		const file = files[0];
		if (!file.type.startsWith('image/gif')) {
			return;
		}

		await handleFile(file);
	}

	async function handleFile(file: File) {
		const objectUrl = URL.createObjectURL(file);
		item.cardData.objectUrl = objectUrl;
		item.cardData.blob = file;
		item.cardData.url = '';
		hasError = false;
	}

	function convertGifUrl(url: string): string {
		const trimmedUrl = url.trim();

		// Giphy page URL: https://giphy.com/gifs/name-name-ID or https://giphy.com/gifs/ID
		const giphyMatch = trimmedUrl.match(/giphy\.com\/gifs\/(?:.*-)?([a-zA-Z0-9]+)(?:\?|$)/);
		if (giphyMatch) {
			return `https://media.giphy.com/media/${giphyMatch[1]}/giphy.gif`;
		}

		// Giphy media URL - already correct format
		if (trimmedUrl.includes('media.giphy.com')) {
			return trimmedUrl;
		}

		// Tenor page URL: https://tenor.com/view/name-name-gif-ID
		const tenorMatch = trimmedUrl.match(/tenor\.com\/view\/.*-(\d+)(?:\?|$)/);
		if (tenorMatch) {
			// Tenor doesn't have a simple direct URL conversion, keep as-is for now
			// Users should use the "Copy GIF" link from Tenor which gives media URL
			return trimmedUrl;
		}

		// Tenor media URL - already correct
		if (trimmedUrl.includes('media.tenor.com') || trimmedUrl.includes('c.tenor.com')) {
			return trimmedUrl;
		}

		// Return as-is for direct GIF URLs or other sources
		return trimmedUrl;
	}

	function handleUrlSubmit() {
		if (urlInput.trim()) {
			item.cardData.url = convertGifUrl(urlInput);
			item.cardData.objectUrl = undefined;
			item.cardData.blob = undefined;
			hasError = false;
		}
		isEditing = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleUrlSubmit();
		}
		if (e.key === 'Escape') {
			urlInput = item.cardData.url || '';
			isEditing = false;
		}
	}

	function handleClick() {
		isEditing = true;
		requestAnimationFrame(() => {
			inputElement?.focus();
			if (getSrc()) {
				inputElement?.select();
			}
		});
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
	class="relative h-full w-full overflow-hidden"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	onclick={handleClick}
>
	{#if getSrc() && !hasError}
		<img
			class="absolute inset-0 h-full w-full object-cover"
			src={getSrc()}
			alt={item.cardData.alt || 'GIF'}
			onerror={() => (hasError = true)}
		/>
	{:else}
		<!-- Empty state / Drop zone -->
		<div
			class="bg-base-100 dark:bg-base-900 flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3 p-4 transition-colors {isDragging
				? 'bg-accent-100 dark:bg-accent-900/30'
				: ''}"
		>
			<div
				class="flex size-12 items-center justify-center rounded-xl border-2 border-dashed {isDragging
					? 'border-accent-500'
					: 'border-base-300 dark:border-base-700'}"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="size-6 {isDragging ? 'text-accent-500' : 'text-base-400 dark:text-base-600'}"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z"
					/>
				</svg>
			</div>
			<div class="text-center">
				<p class="text-base-700 dark:text-base-300 text-sm font-medium">Drop a GIF here</p>
				<p class="text-base-500 dark:text-base-500 mt-1 text-xs">or click to enter URL</p>
			</div>
		</div>
	{/if}

	<!-- URL input overlay -->
	{#if isEditing}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<div
			class="absolute inset-0 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
			onclick={(e) => e.stopPropagation()}
		>
			<div class="w-full max-w-sm">
				<input
					bind:this={inputElement}
					bind:value={urlInput}
					onblur={handleUrlSubmit}
					onkeydown={handleKeydown}
					class="w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white placeholder-white/50 transition-colors outline-none focus:border-white/40 focus:bg-white/20"
					placeholder="Paste GIF URL"
				/>
				<p class="mt-2 text-center text-xs text-white/60">
					Press Enter to confirm, Escape to cancel
				</p>
			</div>
		</div>
	{/if}

	<!-- Drag overlay -->
	{#if isDragging}
		<div
			class="bg-accent-500/20 pointer-events-none absolute inset-0 flex items-center justify-center backdrop-blur-sm"
		>
			<p class="text-accent-700 dark:text-accent-300 text-lg font-semibold">Drop GIF here</p>
		</div>
	{/if}
</div>
