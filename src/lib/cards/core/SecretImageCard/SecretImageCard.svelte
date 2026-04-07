<script lang="ts">
	import { page } from '$app/state';
	import { getDidContext } from '$lib/website/context';
	import { getBlobURL } from '$lib/atproto';
	import { decryptBlob } from './crypto';
	import type { ContentComponentProps } from '../../types';

	let { item = $bindable() }: ContentComponentProps = $props();

	const did = getDidContext();

	let decryptedUrl = $state<string | null>(null);
	let decrypting = $state(false);

	$effect(() => {
		const secret = page.url.searchParams.get('secret');
		const blob = item.cardData.encryptedImage;
		if (!secret || !blob || blob.$type !== 'blob') return;

		decrypting = true;
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
			// Wrong password or fetch error - stay pixelated
		} finally {
			decrypting = false;
		}
	}
</script>

{#if item.cardData.preview}
	<img
		class="absolute inset-0 h-full w-full object-cover"
		style="image-rendering: pixelated;"
		src={item.cardData.preview}
		alt=""
	/>
{/if}

{#if decryptedUrl}
	<img
		class="animate-in fade-in absolute inset-0 h-full w-full object-cover duration-500"
		src={decryptedUrl}
		alt=""
	/>
{/if}

{#if !decryptedUrl}
	<div class="absolute inset-0 flex items-center justify-center">
		<div class="bg-base-900/40 rounded-full p-3 backdrop-blur-sm">
			{#if decrypting}
				<svg
					class="size-6 animate-spin text-white"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
				>
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
					></path>
				</svg>
			{:else}
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="size-6 text-white"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
					/>
				</svg>
			{/if}
		</div>
	</div>
{/if}
