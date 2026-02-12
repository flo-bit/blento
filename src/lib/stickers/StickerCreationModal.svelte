<script lang="ts">
	import { Modal, Button } from '@foxui/core';
	import * as TID from '@atcute/tid';
	import type { Sticker } from './types';

	let {
		open = $bindable(true),
		oncreate,
		page
	}: {
		open?: boolean;
		oncreate: (sticker: Sticker) => void;
		page: string;
	} = $props();

	let tab: 'emoji' | 'image' = $state('emoji');
	let emojiInput = $state('');
	let imageFile: File | null = $state(null);
	let imagePreview: string | null = $state(null);

	function createEmojiSticker() {
		if (!emojiInput.trim()) return;
		oncreate({
			id: TID.now(),
			type: 'emoji',
			emoji: emojiInput.trim(),
			x: 0,
			y: 2000,
			rotation: 0,
			scale: 100,
			page
		});
		emojiInput = '';
		open = false;
	}

	function handleFileChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (!target.files?.[0]) return;
		imageFile = target.files[0];
		imagePreview = URL.createObjectURL(imageFile);
	}

	function createImageSticker() {
		if (!imageFile || !imagePreview) return;
		oncreate({
			id: TID.now(),
			type: 'image',
			image: { blob: imageFile, objectUrl: imagePreview },
			x: 0,
			y: 2000,
			rotation: 0,
			scale: 100,
			page
		});
		imageFile = null;
		imagePreview = null;
		open = false;
	}
</script>

<Modal bind:open>
	<div class="flex flex-col gap-4">
		<h2 class="text-lg font-semibold">Add Sticker</h2>

		<div class="flex gap-2">
			<button
				class={[
					'cursor-pointer rounded-lg px-3 py-1 text-sm font-medium',
					tab === 'emoji' ? 'bg-accent-500 text-white' : 'bg-base-200 dark:bg-base-700'
				]}
				onclick={() => (tab = 'emoji')}
			>
				Emoji
			</button>
			<button
				class={[
					'cursor-pointer rounded-lg px-3 py-1 text-sm font-medium',
					tab === 'image' ? 'bg-accent-500 text-white' : 'bg-base-200 dark:bg-base-700'
				]}
				onclick={() => (tab = 'image')}
			>
				Image
			</button>
		</div>

		{#if tab === 'emoji'}
			<div class="flex flex-col gap-3">
				<input
					type="text"
					bind:value={emojiInput}
					placeholder="Type or paste an emoji..."
					class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-600 rounded-lg border px-3 py-2 text-2xl"
				/>
				<Button onclick={createEmojiSticker} disabled={!emojiInput.trim()}>Add Emoji</Button>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				<input type="file" accept="image/*" onchange={handleFileChange} class="text-sm" />
				{#if imagePreview}
					<img src={imagePreview} alt="Preview" class="h-20 w-20 rounded-lg object-contain" />
				{/if}
				<Button onclick={createImageSticker} disabled={!imageFile}>Add Image</Button>
			</div>
		{/if}
	</div>
</Modal>
