<script lang="ts">
	import { Button, Input, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';
	import { parseRoomyUrl } from './index';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');
</script>

<Modal open={true} closeButton={false}>
	<form
		onsubmit={() => {
			const input = item.cardData.href?.trim();
			if (!input) return;

			const parsed = parseRoomyUrl(input);
			if (!parsed) {
				errorMessage = 'Please enter a valid Roomy room URL';
				return;
			}

			item.cardData.href = input;
			item.cardData.roomId = parsed.roomId;
			if (parsed.spaceId) item.cardData.spaceId = parsed.spaceId;

			item.w = 4;
			item.h = 5;
			item.mobileW = 8;
			item.mobileH = 7;

			oncreate?.();
		}}
		class="flex flex-col gap-2"
	>
		<Subheading>Enter a Roomy room URL</Subheading>
		<Input
			bind:value={item.cardData.href}
			placeholder="https://lite.roomy.space/did:plc:.../01..."
			class="mt-4"
		/>

		{#if errorMessage}
			<p class="mt-2 text-sm text-red-600">{errorMessage}</p>
		{/if}

		<div class="mt-4 flex justify-end gap-2">
			<Button onclick={oncancel} variant="ghost">Cancel</Button>
			<Button type="submit">Create</Button>
		</div>
	</form>
</Modal>
