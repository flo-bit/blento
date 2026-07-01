<script lang="ts">
	import { Button, Input, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';
	import { matcher } from './index';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');
</script>

<Modal open={true} closeButton={false}>
	<form
		onsubmit={() => {
			const url = item.cardData.href?.trim();
			if (!url) return;

			const id = matcher(url);
			if (!id) {
				errorMessage = 'Please enter a valid YouTube URL';
				return;
			}

			item.cardData.youtubeId = id;
			item.cardData.poster = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
			item.cardData.showInline = true;

			item.w = 4;
			item.mobileW = 8;
			item.h = 3;
			item.mobileH = 5;

			oncreate?.();
		}}
		class="flex flex-col gap-2"
	>
		<Subheading>Enter a YouTube URL</Subheading>
		<Input
			bind:value={item.cardData.href}
			placeholder="https://youtube.com/watch?v=..."
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
