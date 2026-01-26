<script lang="ts">
	import type { SettingsComponentProps } from '../types';
	import { Button } from '@foxui/core';

	let { item = $bindable(), onclose }: SettingsComponentProps = $props();

	let fileInput: HTMLInputElement;

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const objectUrl = URL.createObjectURL(file);
		const name = file.name.replace(/\.[^/.]+$/, '');

		item.cardData.sounds = [
			...(item.cardData.sounds ?? []),
			{
				name,
				pendingBlob: file,
				objectUrl
			}
		];

		input.value = '';
	}

	function triggerFileInput() {
		fileInput?.click();
	}
</script>

<div class="flex flex-col gap-2">
	<input
		bind:this={fileInput}
		type="file"
		accept="audio/*"
		onchange={handleFileSelect}
		class="hidden"
	/>

	<Button onclick={triggerFileInput} variant="ghost" class="justify-start">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="mr-2 h-4 w-4"
			viewBox="0 0 20 20"
			fill="currentColor"
		>
			<path
				fill-rule="evenodd"
				d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
				clip-rule="evenodd"
			/>
		</svg>
		Add Sound
	</Button>
</div>
