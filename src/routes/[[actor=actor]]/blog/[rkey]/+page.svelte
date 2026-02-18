<script lang="ts">
	import { getCDNImageBlobUrl } from '$lib/atproto';
	import { Avatar as FoxAvatar } from '@foxui/core';
	import { marked } from 'marked';
	import { sanitize } from '$lib/sanitize';
	import { all, createLowlight } from 'lowlight';

	const lowlight = createLowlight(all);

	function hastToHtml(node: any): string {
		if (node.type === 'text') return escapeHtml(node.value);
		if (node.type === 'element') {
			const cls = node.properties?.className?.join(' ');
			const children = (node.children || []).map(hastToHtml).join('');
			return cls ? `<span class="${cls}">${children}</span>` : `<span>${children}</span>`;
		}
		if (node.type === 'root' || node.children) {
			return (node.children || []).map(hastToHtml).join('');
		}
		return '';
	}

	function escapeHtml(str: string): string {
		return str
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}

	let { data } = $props();

	let post = $derived(data.post as Record<string, unknown>);
	let did: string = $derived(data.did);
	let hostProfile = $derived(data.hostProfile);
	let externalUrl = $derived(data.externalUrl as string | null);

	let title = $derived((post.title as string) || '');
	let description = $derived((post.description as string) || '');
	let publishedAt = $derived(post.publishedAt as string | undefined);

	let hostName = $derived(hostProfile?.displayName || hostProfile?.handle || did);
	let hostUrl = $derived(
		hostProfile?.url ?? `https://bsky.app/profile/${hostProfile?.handle || did}`
	);

	let actorPrefix = $derived(hostProfile?.handle ? `/${hostProfile.handle}` : `/${did}`);

	let coverUrl = $derived.by(() => {
		const coverImage = post.coverImage as { $type: 'blob'; ref: { $link: string } } | undefined;
		if (!coverImage) return undefined;
		return getCDNImageBlobUrl({ did, blob: coverImage, type: 'jpeg' });
	});

	let content = $derived(post.content as { $type: string; value: string } | undefined);
	let isMarkdown = $derived(content?.$type === 'app.blento.markdown');

	let tags = $derived((post.tags as string[]) || []);
	let bskyPostRef = $derived(post.bskyPostRef as { uri: string; cid: string } | undefined);

	let bskyDiscussUrl = $derived.by(() => {
		if (!bskyPostRef?.uri) return undefined;
		const parts = bskyPostRef.uri.split('/');
		const postDid = parts[2];
		const postRkey = parts[parts.length - 1];
		return `https://bsky.app/profile/${postDid}/post/${postRkey}`;
	});

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	const renderer = new marked.Renderer();
	renderer.link = ({ href, title, text }) =>
		`<a target="_blank" rel="noopener noreferrer" href="${href}" title="${title ?? ''}">${text}</a>`;
	renderer.code = ({ text, lang }) => {
		let highlighted: string;
		try {
			const tree =
				lang && lowlight.registered(lang)
					? lowlight.highlight(lang, text)
					: lowlight.highlightAuto(text);
			highlighted = hastToHtml(tree);
		} catch {
			highlighted = escapeHtml(text);
		}
		return `<pre><code class="hljs${lang ? ` language-${lang}` : ''}">${highlighted}</code></pre>`;
	};
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description || `Blog post: ${title}`} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description || `Blog post: ${title}`} />
	{#if coverUrl}
		<meta property="og:image" content={coverUrl} />
	{/if}
	<meta name="twitter:card" content={coverUrl ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description || `Blog post: ${title}`} />
	{#if coverUrl}
		<meta name="twitter:image" content={coverUrl} />
	{/if}
</svelte:head>

<div class="bg-base-50 dark:bg-base-950 min-h-screen px-6 py-12">
	<div class="mx-auto max-w-3xl">
		<!-- Cover image -->
		{#if coverUrl}
			<img src={coverUrl} alt={title} class="mb-8 aspect-video w-full rounded-2xl object-cover" />
		{/if}

		<!-- Title & meta -->
		<header class="mb-8">
			<h1 class="text-base-900 dark:text-base-50 mb-4 text-3xl leading-tight font-bold sm:text-4xl">
				{title}
			</h1>

			<div class="flex flex-wrap items-center gap-4">
				{#if publishedAt}
					<span class="text-base-500 dark:text-base-400 text-sm">
						{formatDate(publishedAt)}
					</span>
				{/if}
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

			{#if tags.length > 0}
				<div class="mt-4 flex flex-wrap gap-2">
					{#each tags as tag (tag)}
						<span
							class="bg-base-100 dark:bg-base-800 text-base-600 dark:text-base-300 rounded-full px-3 py-1 text-xs font-medium"
						>
							{tag}
						</span>
					{/each}
				</div>
			{/if}
		</header>

		<!-- Content -->
		{#if isMarkdown && content}
			<article
				class="prose dark:prose-invert prose-base prose-neutral prose-a:text-accent-600 dark:prose-a:text-accent-400 prose-img:rounded-xl max-w-none"
			>
				{@html sanitize(marked.parse(content.value, { renderer }) as string, {
					ADD_ATTR: ['target']
				})}
			</article>
		{:else}
			<div class="py-4">
				{#if description}
					<p class="text-base-700 dark:text-base-300 mb-6 text-lg leading-relaxed">
						{description}
					</p>
				{/if}

				{#if externalUrl}
					<a
						href={externalUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="bg-base-900 dark:bg-base-50 text-base-50 dark:text-base-900 hover:bg-base-800 dark:hover:bg-base-200 inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium transition-colors"
					>
						Read on original page
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="2"
							stroke="currentColor"
							class="size-4"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
							/>
						</svg>
					</a>
				{/if}
			</div>
		{/if}

		<!-- Footer -->
		<footer
			class="border-base-200 dark:border-base-800 mt-12 flex flex-wrap items-center gap-4 border-t pt-6"
		>
			<a
				href="{actorPrefix}/blog"
				class="text-base-500 dark:text-base-400 hover:text-base-700 dark:hover:text-base-200 inline-flex items-center gap-1.5 text-sm transition-colors"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2"
					stroke="currentColor"
					class="size-4"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18"
					/>
				</svg>
				Back to blog
			</a>

			{#if bskyDiscussUrl}
				<a
					href={bskyDiscussUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="text-base-500 dark:text-base-400 hover:text-base-700 dark:hover:text-base-200 inline-flex items-center gap-1.5 text-sm transition-colors"
				>
					Discuss on Bluesky
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="size-3.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
						/>
					</svg>
				</a>
			{/if}

			{#if externalUrl && isMarkdown}
				<a
					href={externalUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="text-base-500 dark:text-base-400 hover:text-base-700 dark:hover:text-base-200 inline-flex items-center gap-1.5 text-sm transition-colors"
				>
					View on original page
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="size-3.5"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25"
						/>
					</svg>
				</a>
			{/if}
		</footer>
	</div>
</div>

<style>
	:global(.prose pre) {
		background: #f6f8fa;
		border-radius: 1rem;
		color: #1f2328;
		font-family: 'JetBrainsMono', monospace;
		border: 1px solid #d1d9e0;
	}

	:global(.prose pre code) {
		background: none;
		color: inherit;
		font-size: 0.8rem;
		padding: 0;
	}

	:global(.prose pre .hljs-comment),
	:global(.prose pre .hljs-quote) {
		color: #59636e;
		font-style: italic;
	}

	:global(.prose pre .hljs-keyword),
	:global(.prose pre .hljs-selector-tag) {
		color: #cf222e;
	}

	:global(.prose pre .hljs-tag),
	:global(.prose pre .hljs-name) {
		color: #116329;
	}

	:global(.prose pre .hljs-attribute) {
		color: #0550ae;
	}

	:global(.prose pre .hljs-variable),
	:global(.prose pre .hljs-template-variable),
	:global(.prose pre .hljs-regexp),
	:global(.prose pre .hljs-link) {
		color: #0550ae;
	}

	:global(.prose pre .hljs-number),
	:global(.prose pre .hljs-literal) {
		color: #0550ae;
	}

	:global(.prose pre .hljs-string),
	:global(.prose pre .hljs-symbol),
	:global(.prose pre .hljs-bullet) {
		color: #0a3069;
	}

	:global(.prose pre .hljs-title),
	:global(.prose pre .hljs-section) {
		color: #0550ae;
		font-weight: 600;
	}

	:global(.prose pre .hljs-type),
	:global(.prose pre .hljs-built_in),
	:global(.prose pre .hljs-builtin-name),
	:global(.prose pre .hljs-params) {
		color: #953800;
	}

	:global(.prose pre .hljs-meta) {
		color: #0550ae;
	}

	/* Dark mode */
	:global(.dark .prose pre) {
		background: #161b22;
		color: #e6edf3;
		border-color: #30363d;
	}

	:global(.dark .prose pre .hljs-comment),
	:global(.dark .prose pre .hljs-quote) {
		color: #8b949e;
		font-style: italic;
	}

	:global(.dark .prose pre .hljs-keyword),
	:global(.dark .prose pre .hljs-selector-tag) {
		color: #ff7b72;
	}

	:global(.dark .prose pre .hljs-tag),
	:global(.dark .prose pre .hljs-name) {
		color: #7ee787;
	}

	:global(.dark .prose pre .hljs-attribute) {
		color: #79c0ff;
	}

	:global(.dark .prose pre .hljs-variable),
	:global(.dark .prose pre .hljs-template-variable),
	:global(.dark .prose pre .hljs-regexp),
	:global(.dark .prose pre .hljs-link) {
		color: #79c0ff;
	}

	:global(.dark .prose pre .hljs-number),
	:global(.dark .prose pre .hljs-literal) {
		color: #79c0ff;
	}

	:global(.dark .prose pre .hljs-string),
	:global(.dark .prose pre .hljs-symbol),
	:global(.dark .prose pre .hljs-bullet) {
		color: #a5d6ff;
	}

	:global(.dark .prose pre .hljs-title),
	:global(.dark .prose pre .hljs-section) {
		color: #d2a8ff;
		font-weight: 600;
	}

	:global(.dark .prose pre .hljs-type),
	:global(.dark .prose pre .hljs-built_in),
	:global(.dark .prose pre .hljs-builtin-name),
	:global(.dark .prose pre .hljs-params) {
		color: #ffa657;
	}

	:global(.dark .prose pre .hljs-meta) {
		color: #79c0ff;
	}
</style>
