<script lang="ts">
	import { Button, Input, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');
</script>

<Modal open={true} closeButton={false}>
	<form
		onsubmit={() => {
			let input = item.cardData.href?.trim();
			if (!input) return;

			let username: string | undefined;

			try {
				const parsed = new URL(input);
				if (/^(www\.)?last\.fm$/.test(parsed.hostname)) {
					const segments = parsed.pathname.split('/').filter(Boolean);
					if (segments.length >= 2 && segments[0] === 'user') {
						username = segments[1];
					}
				}
			} catch {
				if (/^[a-zA-Z0-9_-]{2,15}$/.test(input)) {
					username = input;
				}
			}

			if (!username) {
				errorMessage = 'Please enter a valid Last.fm username or profile URL';
				return;
			}

			item.cardData.lastfmUsername = username;
			item.cardData.href = `https://www.last.fm/user/${username}`;

			oncreate?.();
		}}
		class="flex flex-col gap-2"
	>
		<Subheading>Enter a Last.fm username or profile URL</Subheading>
		<Input
			bind:value={item.cardData.href}
			placeholder="username or https://www.last.fm/user/username"
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
