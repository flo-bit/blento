<script lang="ts">
	import { page } from '$app/state';
	import { getDidContext } from '$lib/website/context';
	import { getBlobURL } from '$lib/atproto';
	import { decryptBlob } from './crypto';
	import type { ContentComponentProps } from '../../types';
	import { compressImage } from '$lib/atproto/image-helper';

	let { item = $bindable() }: ContentComponentProps = $props();

	const did = getDidContext();

	let fileInput = $state<HTMLInputElement | undefined>(undefined);
	let dragOver = $state(false);
	let decryptedUrl = $state<string | null>(null);

	const imageUrl = $derived(
		item.cardData.rawImage?.objectUrl || decryptedUrl || item.cardData.preview
	);
	const hasImage = $derived(!!imageUrl);
	const showPixelated = $derived(
		!item.cardData.rawImage?.objectUrl && !decryptedUrl && !!item.cardData.preview
	);

	$effect(() => {
		const secret = page.url.searchParams.get('secret');
		const blob = item.cardData.encryptedImage;
		if (!secret || !blob || typeof blob !== 'object' || blob.$type !== 'blob') return;
		if (item.cardData.rawImage?.objectUrl) return;

		decryptImage(secret, blob);

		return () => {
			if (decryptedUrl) {
				URL.revokeObjectURL(decryptedUrl);
				decryptedUrl = null;
			}
		};
	});

	async function decryptImage(password: string, blob: any) {
		try {
			const url = await getBlobURL({ did, blob });
			const response = await fetch(url);
			if (!response.ok) throw new Error('Failed to fetch blob');
			const encryptedBlob = await response.blob();
			const decrypted = await decryptBlob(encryptedBlob, password);
			decryptedUrl = URL.createObjectURL(decrypted);
		} catch {
			// wrong password or fetch error - stay pixelated
		}
	}

	async function handleFile(file: File) {
		const { blob } = await compressImage(file);
		const objectUrl = URL.createObjectURL(blob);
		item.cardData.rawImage = { blob, objectUrl };
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		dragOver = true;
	}

	function handleDragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		dragOver = false;
	}

	async function handleDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		dragOver = false;
		const file = event.dataTransfer?.files?.[0];
		if (file?.type.startsWith('image/')) {
			await handleFile(file);
		}
	}

	async function handleFileInput(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (file) await handleFile(file);
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	class="absolute inset-0 flex flex-col"
	ondragover={handleDragOver}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
>
	<input
		bind:this={fileInput}
		type="file"
		accept="image/*"
		class="hidden"
		onchange={handleFileInput}
	/>

	<!-- Image area -->
	<button
		type="button"
		class="relative flex-1 cursor-pointer overflow-hidden"
		onclick={() => fileInput?.click()}
	>
		{#if hasImage}
			<img
				class="absolute inset-0 h-full w-full object-cover"
				style={showPixelated ? 'image-rendering: pixelated;' : ''}
				src={imageUrl}
				alt=""
			/>
			<div
				class="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/30"
			>
				<span class="text-sm font-medium text-white opacity-0 transition-opacity hover:opacity-100">
					Replace
				</span>
			</div>
		{:else}
			<div
				class="flex h-full items-center justify-center {dragOver
					? 'bg-accent-100 dark:bg-accent-900/30'
					: ''}"
			>
				<div class="text-base-400 flex flex-col items-center gap-1">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-8"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3 21h18a1.5 1.5 0 0 0 1.5-1.5V6A1.5 1.5 0 0 0 21 4.5H3A1.5 1.5 0 0 0 1.5 6v12A1.5 1.5 0 0 0 3 21Z"
						/>
					</svg>
					<span class="text-xs">Drop or click</span>
				</div>
			</div>
		{/if}
	</button>
</div>
