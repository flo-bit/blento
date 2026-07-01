<script lang="ts">
	import type { CreationModalComponentProps } from '../../types';
	import { Button, Input, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');
</script>

<Modal open closeButton={false}>
	<form
		onsubmit={() => {
			let input = item.cardData.href?.trim();
			if (!input || typeof input !== 'string') return;

			let username: string | null = null;

			const url = URL.parse(input);

			if (url) {
				if (url.hostname !== 'listenbrainz.org') {
					errorMessage = 'URL is not from ListenBrainz';
					return;
				}

				const [, user, uname] = url.pathname.split('/');

				if (user === 'user' && uname && typeof uname === 'string') {
					username = uname;
				}
			} else {
				username = input || null;
			}

			if (!username) {
				errorMessage = 'Please enter a valid ListenBrainz username or profile URL';
				return;
			}

			item.cardData.username = username;
			item.cardData.href = `https://listenbrainz.org/user/${username}`;

			oncreate?.();
		}}
		class="flex flex-col gap-2"
	>
		<Subheading>Enter a ListenBrainz username or profile URL</Subheading>
		<Input
			bind:value={item.cardData.href}
			placeholder="username or https://listenbrainz.org/user/username"
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
