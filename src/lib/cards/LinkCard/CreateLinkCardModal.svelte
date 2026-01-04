<script lang="ts">
	import { Button, Input, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let isFetchingMetadata = $state(false);

	async function fetchMetadata() {
		item.cardData.domain = new URL(item.cardData.href).hostname;

		try {
			const response = await fetch('/api/links?link=' + encodeURIComponent(item.cardData.href));
			if (response.ok) {
				const data = await response.json();
				item.cardData.description = data.description || '';
				item.cardData.title = data.title || '';
				item.cardData.image = data.images?.[0] || '';
				item.cardData.favicon = data.favicons?.[0] || undefined;
			}
		} catch (error) {
			console.error('Error fetching metadata:', error);
		} finally {
			isFetchingMetadata = false;
		}
	}
</script>

<Modal open={true}>
	<Subheading level={2}>Enter a link</Subheading>
	<Input bind:value={item.cardData.href} />

	<div class="mt-4 flex justify-end gap-2">
		<Button onclick={oncancel} variant="ghost">Cancel</Button>
		<Button
			disabled={isFetchingMetadata}
			onclick={async () => {
				await fetchMetadata();
				oncreate();
			}}>{isFetchingMetadata ? 'Creating...' : 'Create'}</Button
		>
	</div>
</Modal>
