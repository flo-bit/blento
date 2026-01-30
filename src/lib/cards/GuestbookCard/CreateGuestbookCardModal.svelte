<script lang="ts">
	import { Alert, Button, Input, Modal, Subheading } from '@foxui/core';
	import type { CreationModalComponentProps } from '../types';
	import { createPost } from '$lib/atproto/methods';
	import { user } from '$lib/atproto/auth.svelte';
	import { parseBlueskyPostUrl } from '../BlueskyPostCard/utils';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	let mode = $state<'create' | 'existing'>('create');

	const profileUrl = `https://blento.app/${user.profile?.handle ?? ''}`;
	let postText = $state(`Comment on this post to appear on my Blento! ${profileUrl}`);
	let postUrl = $state('');
	let isPosting = $state(false);
	let errorMessage = $state('');

	function buildFacets(text: string, url: string) {
		const encoder = new TextEncoder();
		const encoded = encoder.encode(text);
		const urlBytes = encoder.encode(url);

		let byteStart = -1;
		for (let i = 0; i <= encoded.length - urlBytes.length; i++) {
			let match = true;
			for (let j = 0; j < urlBytes.length; j++) {
				if (encoded[i + j] !== urlBytes[j]) {
					match = false;
					break;
				}
			}
			if (match) {
				byteStart = i;
				break;
			}
		}

		if (byteStart === -1) return undefined;

		return [
			{
				index: { byteStart, byteEnd: byteStart + urlBytes.length },
				features: [{ $type: 'app.bsky.richtext.facet#link', uri: url }]
			}
		];
	}

	async function handleCreateNew() {
		if (!postText.trim()) {
			errorMessage = 'Post text cannot be empty.';
			return;
		}

		isPosting = true;
		errorMessage = '';

		try {
			const facets = buildFacets(postText, profileUrl);
			const response = await createPost({ text: postText, facets });

			if (!response.ok) {
				throw new Error('Failed to create post');
			}

			item.cardData.uri = response.data.uri;

			const rkey = response.data.uri.split('/').pop();
			item.cardData.href = `https://bsky.app/profile/${user.profile?.handle}/post/${rkey}`;

			oncreate();
		} catch (err) {
			errorMessage =
				err instanceof Error ? err.message : 'Failed to create post. Please try again.';
		} finally {
			isPosting = false;
		}
	}

	function handleExisting() {
		errorMessage = '';
		const parsed = parseBlueskyPostUrl(postUrl.trim());

		if (!parsed) {
			errorMessage =
				'Invalid URL. Please enter a valid Bluesky post URL (e.g., https://bsky.app/profile/handle/post/...)';
			return;
		}

		item.cardData.uri = `at://${parsed.handle}/app.bsky.feed.post/${parsed.rkey}`;
		item.cardData.href = postUrl.trim();

		oncreate();
	}

	async function handleSubmit() {
		if (mode === 'create') {
			await handleCreateNew();
		} else {
			handleExisting();
		}
	}
</script>

<Modal open={true} closeButton={false}>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			handleSubmit();
		}}
		class="flex flex-col gap-2"
	>
		<Subheading>Guestbook</Subheading>

		<div class="flex gap-2">
			<Button
				size="sm"
				variant="ghost"
				class={mode === 'create' ? 'bg-base-200 dark:bg-base-700' : ''}
				onclick={() => (mode = 'create')}
			>
				Create new post
			</Button>
			<Button
				size="sm"
				variant="ghost"
				class={mode === 'existing' ? 'bg-base-200 dark:bg-base-700' : ''}
				onclick={() => (mode = 'existing')}
			>
				Use existing post
			</Button>
		</div>

		{#if mode === 'create'}
			<p class="text-base-500 dark:text-base-400 text-sm">
				This will create a post on your Bluesky account. Replies to that post will appear on your
				guestbook card.
			</p>
			<textarea
				bind:value={postText}
				rows="4"
				class="bg-base-100 dark:bg-base-800 border-base-300 dark:border-base-600 mt-2 w-full rounded-lg border p-3 text-sm focus:outline-none"
			></textarea>
		{:else}
			<p class="text-base-500 dark:text-base-400 text-sm">
				Paste a Bluesky post URL to use as your guestbook. Replies to that post will appear on your
				card.
			</p>
			<Input bind:value={postUrl} placeholder="https://bsky.app/profile/handle/post/..." />
		{/if}

		{#if errorMessage}
			<Alert type="error" title="Error"><span>{errorMessage}</span></Alert>
		{/if}

		<div class="mt-4 flex justify-end gap-2">
			<Button onclick={oncancel} variant="ghost">Cancel</Button>
			{#if mode === 'create'}
				<Button type="submit" disabled={isPosting || !postText.trim()}>
					{isPosting ? 'Posting...' : 'Post to Bluesky & Create'}
				</Button>
			{:else}
				<Button type="submit" disabled={!postUrl.trim()}>Create</Button>
			{/if}
		</div>
	</form>
</Modal>
