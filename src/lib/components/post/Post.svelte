<script lang="ts">
	import Embed from './embeds/Embed.svelte';
	import { cn, Avatar, Prose } from '@foxui/core';
	import type { WithChildren, WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { PostData } from '.';
	import PostAction from './PostAction.svelte';
	import type { Snippet } from 'svelte';
	import { numberToHumanReadable } from '..';
	import { RelativeTime } from '@foxui/time';

	let {
		ref = $bindable(),
		data,
		class: className,
		bookmarked = $bindable(false),
		liked = $bindable(false),

		showReply = $bindable(true),
		showRepost = $bindable(true),
		showLike = $bindable(true),
		showBookmark = $bindable(true),

		onReplyClick,
		onRepostClick,
		onLikeClick,
		onBookmarkClick,

		replyHref,
		repostHref,
		likeHref,

		customActions,

		children,

		logo
	}: WithElementRef<WithChildren<HTMLAttributes<HTMLDivElement>>> & {
		data: PostData;
		class?: string;

		bookmarked?: boolean;
		liked?: boolean;

		showReply?: boolean;
		showRepost?: boolean;
		showLike?: boolean;
		showBookmark?: boolean;

		onReplyClick?: () => void;
		onRepostClick?: () => void;
		onLikeClick?: () => void;
		onBookmarkClick?: () => void;

		replyHref?: string;
		repostHref?: string;
		likeHref?: string;

		customActions?: Snippet;

		logo?: Snippet;
	} = $props();
</script>

<div
	bind:this={ref}
	class={cn('text-base-950 dark:text-base-50 transition-colors duration-200', className)}
>
	{#if data.reposted}
		<div class="mb-3 inline-flex items-center gap-2 text-xs">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				class="size-3"
			>
				<path
					fill-rule="evenodd"
					d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388Zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918Z"
					clip-rule="evenodd"
				/>
			</svg>

			<div class="inline-flex gap-1">
				reposted by
				<a
					href={data.reposted.href}
					class="hover:text-accent-600 dark:hover:text-accent-400 font-bold"
				>
					@{data.reposted.handle}
				</a>
			</div>
		</div>
	{/if}
	{#if data.replyTo}
		<div class="mb-3 inline-flex items-center gap-2 text-xs">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="currentColor"
				class="size-3"
			>
				<path
					fill-rule="evenodd"
					d="M14.47 2.47a.75.75 0 0 1 1.06 0l6 6a.75.75 0 0 1 0 1.06l-6 6a.75.75 0 1 1-1.06-1.06l4.72-4.72H9a5.25 5.25 0 1 0 0 10.5h3a.75.75 0 0 1 0 1.5H9a6.75 6.75 0 0 1 0-13.5h10.19l-4.72-4.72a.75.75 0 0 1 0-1.06Z"
					clip-rule="evenodd"
				/>
			</svg>

			<div class="inline-flex gap-1">
				replying to
				<a
					href={data.replyTo.href}
					class="hover:text-accent-600 dark:hover:text-accent-400 font-bold"
				>
					@{data.replyTo.handle}
				</a>
			</div>
		</div>
	{/if}
	<div class="flex gap-4">
		<div class="w-full">
			<div class="mb-1 flex items-start justify-between gap-2">
				<div class="flex items-start gap-4">
					{#if data.author.href}
						<a
							class="hover:bg-accent-900/5 accent:hover:bg-accent-100/10 group/post-author -mx-2 -my-0.5 flex flex-col items-baseline gap-x-2 gap-y-0.5 rounded-xl px-2 py-0.5 sm:flex-row"
							href={data.author.href}
						>
							{#if data.author.displayName}
								<div
									class="text-base-900 group-hover/post-author:text-accent-600 dark:text-base-50 dark:group-hover/post-author:text-accent-300 accent:group-hover/post-author:text-accent-950 line-clamp-1 text-sm leading-tight font-semibold"
								>
									{data.author.displayName}
								</div>
							{/if}
							<div
								class={cn(
									'group-hover/post-author:text-accent-600 dark:group-hover/post-author:text-accent-400 accent:text-accent-950 accent:group-hover/post-author:text-accent-900 text-sm',
									!data.author.displayName
										? 'text-base-900 dark:text-base-50 font-semibold'
										: 'text-base-600 dark:text-base-400'
								)}
							>
								@{data.author.handle}
							</div>
						</a>
					{:else}
						<div
							class="-mx-2 -my-0.5 flex flex-col items-baseline gap-x-2 gap-y-0.5 rounded-xl px-2 py-0.5 sm:flex-row"
						>
							<div class="text-base-900 dark:text-base-50 text-sm leading-tight font-semibold">
								{data.author.displayName}
							</div>
							<div class="text-base-600 dark:text-base-400 accent:text-accent-950 text-sm">
								@{data.author.handle}
							</div>
						</div>
					{/if}

					<div
						class="text-base-600 dark:text-base-400 accent:text-accent-950 block text-sm no-underline"
					>
						<RelativeTime date={new Date(data.createdAt)} locale="en" />
					</div>
				</div>

				{#if logo}
					{@render logo?.()}
				{/if}
			</div>

			<Prose
				size="md"
				class="accent:prose-a:text-accent-950 accent:text-base-900 accent:prose-p:text-base-900 accent:prose-a:underline"
			>
				{#if data.htmlContent}
					{@html data.htmlContent}
				{:else}
					{@render children?.()}
				{/if}
			</Prose>

			{#if data.embed}
				<Embed embed={data.embed} />
			{/if}

			{#if showReply || showRepost || showLike || showBookmark || customActions}
				<div
					class="text-base-500 dark:text-base-400 accent:text-base-900 mt-4 flex justify-between gap-2"
				>
					{#if showReply}
						<PostAction onclick={onReplyClick} href={replyHref}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="group-hover/post-action:bg-accent-500/10 group-hover/post-action:text-accent-700 dark:group-hover/post-action:text-accent-400 -m-1.5 size-7 rounded-full p-1.5 transition-all duration-100"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785A5.969 5.969 0 0 0 6 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337Z"
								/>
							</svg>
							{#if data.replyCount}
								{numberToHumanReadable(data.replyCount)}
							{/if}
						</PostAction>
					{/if}

					{#if showRepost}
						<PostAction onclick={onRepostClick} href={repostHref}>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="group-hover/post-action:bg-accent-500/10 group-hover/post-action:text-accent-700 dark:group-hover/post-action:text-accent-400 -m-1.5 size-7 rounded-full p-1.5 transition-all duration-100"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
								/>
							</svg>
							{#if data.repostCount}
								{numberToHumanReadable(data.repostCount)}
							{/if}
						</PostAction>
					{/if}
					{#if showLike}
						<PostAction
							class={liked ? 'text-accent-700 dark:text-accent-500 font-semibold' : ''}
							onclick={onLikeClick}
							href={likeHref}
						>
							{#if liked}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									class="group-hover/post-action:bg-accent-500/10 text-accent-700 dark:text-accent-500 -m-1.5 size-7 rounded-full p-1.5 transition-all duration-100"
								>
									<path
										d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
									class="group-hover/post-action:bg-accent-500/10 group-hover/post-action:text-accent-700 dark:group-hover/post-action:text-accent-400 -m-1.5 size-7 rounded-full p-1.5 transition-all duration-100"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
									/>
								</svg>
							{/if}
							{#if data.likeCount}
								{numberToHumanReadable(data.likeCount)}
							{/if}
						</PostAction>
					{/if}

					{#if showBookmark}
						<PostAction onclick={onBookmarkClick}>
							<span class="sr-only">Bookmark</span>

							{#if bookmarked}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="currentColor"
									class="group-hover/post-action:bg-accent-500/10 text-accent-700 dark:text-accent-400 -m-1.5 size-7 rounded-full p-1.5 transition-all duration-100"
								>
									<path
										fill-rule="evenodd"
										d="M6.32 2.577a49.255 49.255 0 0 1 11.36 0c1.497.174 2.57 1.46 2.57 2.93V21a.75.75 0 0 1-1.085.67L12 18.089l-7.165 3.583A.75.75 0 0 1 3.75 21V5.507c0-1.47 1.073-2.756 2.57-2.93Z"
										clip-rule="evenodd"
									/>
								</svg>
							{:else}
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
									class="group-hover/post-action:bg-accent-500/10 group-hover/post-action:text-accent-700 dark:group-hover/post-action:text-accent-400 -m-1.5 size-7 rounded-full p-1.5 transition-all duration-100"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z"
									/>
								</svg>
							{/if}
						</PostAction>
					{/if}

					{@render customActions?.()}
				</div>
			{/if}
		</div>
	</div>
</div>
