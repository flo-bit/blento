<script lang="ts">
	import { Button, Input, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';
	import { parseSkyboardUrl } from './index';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');
</script>

<Modal open={true} closeButton={false}>
	<form
		onsubmit={() => {
			const input = item.cardData.href?.trim();
			if (!input) return;

			const parsed = parseSkyboardUrl(input);
			if (!parsed) {
				errorMessage = 'Please enter a valid Skyboard board URL';
				return;
			}

			item.cardData.href = input;
			item.cardData.did = parsed.did;
			item.cardData.rkey = parsed.rkey;

			item.w = 6;
			item.h = 4;
			item.mobileW = 8;
			item.mobileH = 8;

			oncreate?.();
		}}
		class="flex flex-col gap-2"
	>
		<Subheading>Enter a Skyboard board URL</Subheading>
		<Input
			bind:value={item.cardData.href}
			placeholder="https://skyboard.dev/board/did:plc:.../rkey"
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
