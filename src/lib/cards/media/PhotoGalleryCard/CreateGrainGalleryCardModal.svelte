<script lang="ts">
	import { Alert, Button, Input, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../../types';
	import { parseGrainGalleryUrl } from './helpers';
	import { resolveHandle } from '$lib/atproto';
	import type { Handle } from '@atcute/lexicons';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let isValidating = $state(false);
	let errorMessage = $state('');

	async function checkUrl() {
		errorMessage = '';
		isValidating = true;

		try {
			const parsed = parseGrainGalleryUrl(item.cardData.href);
			if (!parsed) {
				errorMessage = 'Please enter a valid grain.social gallery URL';
				return false;
			}

			const did = await resolveHandle({ handle: parsed.handle as Handle });
			if (!did) {
				errorMessage = 'Could not resolve handle';
				return false;
			}

			item.cardData.galleryUri = `at://${did}/social.grain.gallery/${parsed.rkey}`;
			return true;
		} finally {
			isValidating = false;
		}
	}
</script>

<Modal open={true} closeButton={false}>
	<form
		onsubmit={async () => {
			if (await checkUrl()) oncreate();
		}}
		class="flex flex-col gap-2"
	>
		<Subheading>Enter a grain.social gallery URL</Subheading>
		<Input
			bind:value={item.cardData.href}
			placeholder="https://grain.social/profile/handle/gallery/..."
		/>

		{#if errorMessage}
			<Alert type="error" title="Invalid URL"><span>{errorMessage}</span></Alert>
		{/if}

		<div class="mt-4 flex justify-end gap-2">
			<Button onclick={oncancel} variant="ghost">Cancel</Button>
			<Button type="submit" disabled={isValidating}>
				{isValidating ? 'Creating...' : 'Create'}
			</Button>
		</div>
	</form>
</Modal>
