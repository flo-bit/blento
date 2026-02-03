<script lang="ts">
	import { Button, Input, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../../types';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let errorMessage = $state('');
	let inputValue = $state('');
</script>

<Modal open={true} closeButton={false}>
	<form
		onsubmit={() => {
			let input = inputValue.trim();
			if (!input) {
				errorMessage = 'Please enter a repository in owner/repo format or a GitHub URL';
				return;
			}

			let owner: string | undefined;
			let repo: string | undefined;

			// Try parsing as URL first
			try {
				const parsed = new URL(input);
				if (/^(www\.)?github\.com$/.test(parsed.hostname)) {
					const segments = parsed.pathname.split('/').filter(Boolean);
					if (segments.length >= 2) {
						owner = segments[0];
						repo = segments[1];
					}
				}
			} catch {
				// Not a URL, try as owner/repo format
				const parts = input.split('/');
				if (parts.length === 2) {
					owner = parts[0].trim();
					repo = parts[1].trim();
				}
			}

			if (!owner || !repo) {
				errorMessage = 'Please enter a valid owner/repo or GitHub repository URL';
				return;
			}

			item.cardData.owner = owner;
			item.cardData.repo = repo;
			item.cardData.href = `https://github.com/${owner}/${repo}`;

			item.w = 4;
			item.mobileW = 8;
			item.h = 2;
			item.mobileH = 4;

			oncreate?.();
		}}
		class="flex flex-col gap-2"
	>
		<Subheading>Enter a GitHub repository</Subheading>
		<Input
			bind:value={inputValue}
			placeholder="owner/repo or https://github.com/owner/repo"
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
