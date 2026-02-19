<script lang="ts">
	import { getCDNImageBlobUrl } from '$lib/atproto';
	import { user } from '$lib/atproto/auth.svelte';
	import { Avatar as FoxAvatar, Button } from '@foxui/core';

	let { data } = $props();

	let posts = $derived(data.posts);
	let did: string = $derived(data.did);
	let hostProfile = $derived(data.hostProfile);

	let hostName = $derived(hostProfile?.displayName || hostProfile?.handle || did);
	let hostUrl = $derived(
		hostProfile?.url ?? `https://bsky.app/profile/${hostProfile?.handle || did}`
	);

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		};
		return date.toLocaleDateString('en-US', options);
	}

	let actorPrefix = $derived(hostProfile?.handle ? `/${hostProfile.handle}` : `/${did}`);
	let isOwner = $derived(user.isLoggedIn && user.did === did);

	function getCoverUrl(
		coverImage: { $type: 'blob'; ref: { $link: string } } | undefined
	): string | undefined {
		if (!coverImage) return undefined;
		return getCDNImageBlobUrl({ did, blob: coverImage, type: 'jpeg' });
	}
</script>

<svelte:head>
	<title>{hostName} - Blog</title>
	<meta name="description" content="Blog posts by {hostName}" />
	<meta property="og:title" content="{hostName} - Blog" />
	<meta property="og:description" content="Blog posts by {hostName}" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="{hostName} - Blog" />
	<meta name="twitter:description" content="Blog posts by {hostName}" />
</svelte:head>

<div class="min-h-screen px-6 py-12">
	<div class="mx-auto max-w-2xl">
		<!-- Header -->
		<div class="mb-8">
			<div class="flex items-center justify-between gap-4">
				<h1 class="text-base-900 dark:text-base-50 mb-2 text-2xl font-bold sm:text-3xl">Blog</h1>
				{#if isOwner}
					<Button href="{actorPrefix}/blog/new">New post</Button>
				{/if}
			</div>
			<div class="mt-4 flex items-center gap-2">
				<span class="text-base-500 dark:text-base-400 text-sm">Written by</span>
				<a
					href={hostUrl}
					target={hostProfile?.hasBlento ? undefined : '_blank'}
					rel={hostProfile?.hasBlento ? undefined : 'noopener noreferrer'}
					class="flex items-center gap-1.5 hover:underline"
				>
					<FoxAvatar src={hostProfile?.avatar} alt={hostName} class="size-5 shrink-0" />
					<span class="text-base-900 dark:text-base-100 text-sm font-medium">{hostName}</span>
				</a>
			</div>
		</div>

		{#if posts.length === 0}
			<p class="text-base-500 dark:text-base-400 py-12 text-center">No blog posts found.</p>
		{:else}
			<div class="divide-base-100 dark:divide-base-900 divide-y">
				{#each posts as post (post.rkey)}
					{@const coverUrl = getCoverUrl(post.coverImage)}
					<a
						href={post.href}
						target={post.href.startsWith('./') ? undefined : '_blank'}
						rel={post.href.startsWith('./') ? undefined : 'noopener noreferrer'}
						class="group flex items-start gap-4 py-6"
					>
						<div class="min-w-0 flex-1">
							{#if post.publishedAt}
								<p class="text-base-500 dark:text-base-400 mb-1 text-sm">
									{formatDate(post.publishedAt)}
								</p>
							{/if}
							<h2
								class="text-base-900 dark:text-base-50 group-hover:text-base-700 dark:group-hover:text-base-200 mb-2 text-lg leading-snug font-semibold"
							>
								{post.title}
							</h2>
							{#if post.description}
								<p class="text-base-600 dark:text-base-400 line-clamp-3 text-sm leading-relaxed">
									{post.description}
								</p>
							{/if}
						</div>

						{#if coverUrl}
							<img
								src={coverUrl}
								alt={post.title}
								class="aspect-video w-32 shrink-0 rounded-lg object-cover"
							/>
						{/if}
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
