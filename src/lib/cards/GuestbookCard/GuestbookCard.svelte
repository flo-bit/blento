<script lang="ts">
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import { CardDefinitionsByType } from '..';
	import type { ContentComponentProps } from '../types';
	import { Button } from '@foxui/core';
	import { BlueskyPost } from '$lib/components/bluesky-post';
	import type { PostView } from '@atcute/bluesky/types/app/feed/defs';

	let { item }: ContentComponentProps = $props();

	const data = getAdditionalUserData();
	const did = getDidContext();
	const handle = getHandleContext();

	type Reply = {
		$type: string;
		post: PostView;
	};

	let isLoaded = $state(false);

	let cardUri = $derived(item.cardData.uri as string);

	// svelte-ignore state_referenced_locally
	let replies = $state<Reply[]>(
		((data['guestbook'] as Record<string, Reply[]>)?.[item.cardData.uri as string] ?? []) as Reply[]
	);

	onMount(async () => {
		if (!cardUri) {
			isLoaded = true;
			return;
		}

		try {
			const loaded = await CardDefinitionsByType[item.cardType]?.loadData?.([item], {
				did,
				handle
			});
			const result = loaded as Record<string, Reply[]> | undefined;
			const freshReplies = result?.[cardUri] ?? [];

			if (freshReplies.length > 0) {
				replies = freshReplies;
			}

			if (!data['guestbook']) {
				data['guestbook'] = {};
			}
			(data['guestbook'] as Record<string, Reply[]>)[cardUri] = replies;
		} catch (e) {
			console.error('Failed to load guestbook replies', e);
		}

		isLoaded = true;
	});
</script>

<div class="flex h-full flex-col overflow-hidden p-4">
	{#if item.cardData.href}
		<div class="mb-2 flex justify-end">
			<a href={item.cardData.href} target="_blank" rel="noopener noreferrer">
				<Button size="sm">Add a comment on Bluesky</Button>
			</a>
		</div>
	{/if}

	<div class="flex-1 overflow-y-auto">
		{#if replies.length > 0}
			<div class="replies">
				{#each replies as reply (reply.post.uri)}
					<div class="reply">
						<BlueskyPost feedViewPost={reply.post} showAvatar compact showLogo={false} />
					</div>
				{/each}
			</div>
		{:else if isLoaded}
			<div
				class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
			>
				No comments yet — share your Bluesky post to get started!
			</div>
		{:else}
			<div
				class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
			>
				Loading comments...
			</div>
		{/if}
	</div>
</div>

<style>
	.reply {
		padding-bottom: 1rem;
		margin-bottom: 1rem;
		border-bottom: 1px solid oklch(0.5 0 0 / 0.1);
	}

	.reply:last-child {
		border-bottom: none;
		margin-bottom: 0;
		padding-bottom: 0;
	}

	.reply :global(img:not([class*='rounded-full'])) {
		max-height: 10rem;
	}

	.reply :global(article) {
		max-height: 10rem;
	}

	@container card (width >= 30rem) {
		.replies {
			columns: 2;
			column-gap: 1.5rem;
			column-rule: 1px solid oklch(0.5 0 0 / 0.15);
		}

		.reply {
			break-inside: avoid;
		}
	}
</style>
