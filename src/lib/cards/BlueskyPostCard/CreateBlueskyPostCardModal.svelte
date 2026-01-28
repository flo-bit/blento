<script lang="ts">
	import { Alert, Button, Input, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../types';
	import { parseBlueskyPostUrl } from './utils';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let isValidating = $state(false);
	let errorMessage = $state('');
	let postUrl = $state('');

	async function validateAndCreate() {
		errorMessage = '';
		isValidating = true;

		try {
			const parsed = parseBlueskyPostUrl(postUrl.trim());

			if (!parsed) {
				throw new Error('Invalid URL format');
			}

			// Construct AT URI using handle (will be resolved to DID when loading)
			item.cardData.uri = `at://${parsed.handle}/app.bsky.feed.post/${parsed.rkey}`;
			item.cardData.href = postUrl.trim();

			return true;
		} catch (err) {
			errorMessage =
				err instanceof Error && err.message === 'Post not found'
					? "Couldn't find that post. Please check the URL and try again."
					: err instanceof Error && err.message === 'Could not resolve handle'
						? "Couldn't find that user. Please check the URL and try again."
						: 'Invalid URL. Please enter a valid Bluesky post URL (e.g., https://bsky.app/profile/handle/post/rkey).';
			return false;
		} finally {
			isValidating = false;
		}
	}
</script>

<Modal open={true} closeButton={false}>
	<form
		onsubmit={async () => {
			if (await validateAndCreate()) oncreate();
		}}
		class="flex flex-col gap-2"
	>
		<Subheading>Enter a Bluesky post URL</Subheading>
		<Input
			bind:value={postUrl}
			placeholder="https://bsky.app/profile/handle/post/..."
			class="mt-4"
		/>

		{#if errorMessage}
			<Alert type="error" title="Failed to create post card"><span>{errorMessage}</span></Alert>
		{/if}

		<p class="text-base-500 dark:text-base-400 mt-2 text-xs">
			Paste a URL from <a
				href="https://bsky.app"
				class="text-accent-800 dark:text-accent-300"
				target="_blank">bsky.app</a
			> to embed a Bluesky post.
		</p>

		<div class="mt-4 flex justify-end gap-2">
			<Button onclick={oncancel} variant="ghost">Cancel</Button>
			<Button type="submit" disabled={isValidating || !postUrl.trim()}
				>{isValidating ? 'Creating...' : 'Create'}</Button
			>
		</div>
	</form>
</Modal>
