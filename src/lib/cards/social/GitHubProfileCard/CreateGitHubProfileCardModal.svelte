<script lang="ts">
	import { Button, Input, Modal, Subheading } from '@foxui/core';
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

			// Try parsing as URL first
			try {
				const parsed = new URL(input);
				if (/^(www\.)?github\.com$/.test(parsed.hostname)) {
					const segments = parsed.pathname.split('/').filter(Boolean);
					if (
						segments.length === 1 &&
						/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(segments[0])
					) {
						username = segments[0];
					}
				}
			} catch {
				// Not a URL, try as plain username
				if (/^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(input)) {
					username = input;
				}
			}

			if (!username) {
				errorMessage = 'Please enter a valid GitHub username or profile URL';
				return;
			}

			item.cardData.user = username;
			item.cardData.href = `https://github.com/${username}`;

			item.w = 6;
			item.mobileW = 8;
			item.h = 3;
			item.mobileH = 6;

			oncreate?.();
		}}
		class="flex flex-col gap-2"
	>
		<Subheading>Enter a GitHub username or profile URL</Subheading>
		<Input
			bind:value={item.cardData.href}
			placeholder="username or https://github.com/username"
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
