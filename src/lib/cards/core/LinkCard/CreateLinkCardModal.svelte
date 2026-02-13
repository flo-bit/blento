<script lang="ts">
	import { Button, Input, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';
	import { validateLink } from '$lib/helper';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let isFetchingLocation = $state(false);

	let errorMessage = $state('');
</script>

<Modal open={true} closeButton={false}>
	<form
		onsubmit={() => {
			if (!item.cardData.href.trim()) return;

			let link = validateLink(item.cardData.href);
			if (!link) {
				errorMessage = 'Invalid link';
				return;
			}

			item.cardData.href = link;
			item.cardData.domain = new URL(link).hostname;
			item.cardData.hasFetched = false;

			oncreate?.();
		}}
		class="flex flex-col gap-2"
	>
		<Subheading>Enter a link</Subheading>
		<Input bind:value={item.cardData.href} class="mt-4" />

		{#if errorMessage}
			<p class="mt-2 text-sm text-red-600">{errorMessage}</p>
		{/if}

		<div class="mt-4 flex justify-end gap-2">
			<Button onclick={oncancel} variant="ghost">Cancel</Button>
			<Button type="submit" disabled={isFetchingLocation}>Create</Button>
		</div>
	</form>
</Modal>
