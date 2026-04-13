<script lang="ts">
	import { validateLink } from '$lib/helper';
	import type { Item } from '$lib/types';
	import Modal from '$lib/components/modal/Modal.svelte';
	import { Button, Input, Textarea, toast } from '@foxui/core';

	let { item, onclose }: { item: Item; onclose: () => void } = $props();

	let linkValue = $derived(
		item.cardData.href?.replace('https://', '').replace('http://', '') ?? ''
	);

	let altModalOpen = $state(false);

	function updateLink() {
		if (!linkValue.trim()) {
			item.cardData.href = '';
			item.cardData.domain = '';
		}

		let link = validateLink(linkValue);
		if (!link) {
			toast.error('Invalid link');
			return;
		}

		item.cardData.href = link;
		item.cardData.domain = new URL(link).hostname;

		onclose?.();
	}

	function openAltModal() {
		if (item.cardData.alt === undefined || item.cardData.alt === null) {
			item.cardData.alt = '';
		}
		altModalOpen = true;
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex flex-row gap-2">
		<Input
			spellcheck={false}
			type="url"
			bind:value={linkValue}
			onkeydown={(event) => {
				if (event.code === 'Enter') {
					updateLink();
					event.preventDefault();
				}
			}}
			placeholder="Enter link"
		/>
		<Button onclick={updateLink} size="icon">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-6"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
			</svg>
		</Button>
	</div>

	<Button variant="ghost" onclick={openAltModal} class="w-full justify-start gap-2">
		<svg
			xmlns="http://www.w3.org/2000/svg"
			fill="none"
			viewBox="0 0 24 24"
			stroke-width="1.5"
			stroke="currentColor"
			class="size-4"
		>
			<path stroke-linecap="round" stroke-linejoin="round" d="M3 6.75h18M3 12h18M3 17.25h12" />
		</svg>
		{item.cardData.alt ? 'Edit alt text' : 'Add alt text'}
	</Button>
</div>

<Modal bind:open={altModalOpen} closeButton>
	<div class="flex flex-col gap-3 p-2">
		<h2 class="text-lg font-semibold">Alt text</h2>
		<p class="text-base-600 dark:text-base-400 text-sm">
			Describe the image for screen readers and when it can't load.
		</p>
		<Textarea bind:value={item.cardData.alt} placeholder="Describe the image..." class="h-32" />
		<div class="flex justify-end">
			<Button onclick={() => (altModalOpen = false)}>Done</Button>
		</div>
	</div>
</Modal>
