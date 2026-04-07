<script lang="ts">
	import { Button, Input, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';
	import { compressImage } from '$lib/atproto/image-helper';
	import { createPixelatedPreview, encryptBlob } from './crypto';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let fileInput = $state<HTMLInputElement | undefined>(undefined);
	let imagePreview = $state<string | undefined>(undefined);
	let selectedFile = $state<Blob | undefined>(undefined);
	let password = $state('');
	let errorMessage = $state('');
	let processing = $state(false);

	async function handleFileChange(event: Event) {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];
		if (!file) return;

		const { blob } = await compressImage(file);
		selectedFile = blob;
		imagePreview = URL.createObjectURL(blob);
	}

	async function handleCreate() {
		errorMessage = '';
		if (!selectedFile) {
			errorMessage = 'Please select an image';
			return;
		}
		if (!password.trim()) {
			errorMessage = 'Please enter a password';
			return;
		}

		processing = true;
		try {
			const preview = await createPixelatedPreview(selectedFile);
			const encrypted = await encryptBlob(selectedFile, password.trim());

			item.cardData = {
				encryptedImage: { blob: encrypted },
				preview
			};

			oncreate();
		} catch {
			errorMessage = 'Failed to encrypt image';
			processing = false;
		}
	}
</script>

<Modal open={true} closeButton={false}>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleCreate();
		}}
		class="flex flex-col gap-4"
	>
		<Subheading>Secret Image</Subheading>

		<div>
			<button
				type="button"
				onclick={() => fileInput?.click()}
				class="border-base-300 dark:border-base-600 hover:bg-base-100 dark:hover:bg-base-700 flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors"
			>
				{#if imagePreview}
					<img src={imagePreview} alt="Preview" class="h-full w-full object-cover" />
				{:else}
					<span class="text-base-500 text-sm">Click to select image</span>
				{/if}
			</button>
			<input
				bind:this={fileInput}
				type="file"
				accept="image/*"
				class="hidden"
				onchange={handleFileChange}
			/>
		</div>

		<Input type="password" bind:value={password} placeholder="Enter password" />

		{#if errorMessage}
			<p class="text-sm text-red-600">{errorMessage}</p>
		{/if}

		<div class="flex justify-end gap-2">
			<Button onclick={oncancel} variant="ghost">Cancel</Button>
			<Button type="submit" disabled={processing}>
				{processing ? 'Encrypting...' : 'Create'}
			</Button>
		</div>
	</form>
</Modal>
