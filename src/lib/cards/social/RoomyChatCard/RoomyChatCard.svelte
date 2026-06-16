<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { marked } from 'marked';
	import { sanitize } from '$lib/helpers/sanitize';
	import { getAdditionalUserData } from '$lib/website/data/context';
	import type { ContentComponentProps } from '../../types';
	import type { RoomyRoomData, RoomyLoadedData } from './types';
	import { fetchRoomyRoom } from './api.remote';

	let { item }: ContentComponentProps = $props();

	const roomId = $derived(item.cardData.roomId as string | undefined);
	const spaceId = $derived(item.cardData.spaceId as string | undefined);

	const href = $derived(
		(item.cardData.href as string | undefined) ??
			(spaceId && roomId ? `https://lite.roomy.space/${spaceId}/${roomId}` : 'https://roomy.space')
	);

	// Message links are written in the context of the Roomy room, so resolve any
	// relative ones against the room URL instead of the host Blento page.
	function resolveHref(linkHref: string | undefined): string {
		if (!linkHref) return href;
		try {
			return new URL(linkHref, href).href;
		} catch {
			return linkHref;
		}
	}

	const renderer = new marked.Renderer();
	renderer.link = ({ href: linkHref, title, text }) =>
		`<a target="_blank" rel="noopener noreferrer" href="${resolveHref(linkHref)}" title="${title ?? ''}">${text}</a>`;

	function renderContent(content: string): string {
		return sanitize(marked.parse(content, { renderer, breaks: true, gfm: true }) as string, {
			ADD_ATTR: ['target', 'rel']
		});
	}

	const additional = getAdditionalUserData();

	// svelte-ignore state_referenced_locally
	let room = $state<RoomyRoomData | undefined>(
		roomId ? (additional[item.cardType] as RoomyLoadedData)?.[roomId] : undefined
	);
	let loading = $state(false);

	// Messages arrive oldest-first; render chronologically and pin to the bottom.
	const messages = $derived(room?.messages ?? []);

	let scroller: HTMLDivElement | undefined = $state();

	function scrollToBottom() {
		if (scroller) scroller.scrollTop = scroller.scrollHeight;
	}

	async function load() {
		if (!roomId) return;
		loading = true;
		try {
			const data = await fetchRoomyRoom({ roomId });
			if (data) {
				room = data;
				additional[item.cardType] ??= {};
				(additional[item.cardType] as RoomyLoadedData)[roomId] = data;
				await tick();
				scrollToBottom();
			}
		} catch (error) {
			console.error('Failed to fetch roomy room:', error);
		} finally {
			loading = false;
		}
	}

	onMount(async () => {
		if (room) {
			await tick();
			scrollToBottom();
			return;
		}
		await load();
	});

	const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

	function relativeTime(timestamp: string): string {
		const then = new Date(timestamp).getTime();
		if (Number.isNaN(then)) return '';
		const diff = then - Date.now();
		const abs = Math.abs(diff);
		const min = 60 * 1000;
		const hour = 60 * min;
		const day = 24 * hour;
		if (abs < hour) return rtf.format(Math.round(diff / min), 'minute');
		if (abs < day) return rtf.format(Math.round(diff / hour), 'hour');
		if (abs < 30 * day) return rtf.format(Math.round(diff / day), 'day');
		return new Date(timestamp).toLocaleDateString();
	}
</script>

<div class="@container flex h-full w-full flex-col overflow-hidden">
	<!-- Header -->
	<div class="flex shrink-0 items-center justify-between gap-2 px-3 pt-3 pb-2">
		<div class="flex min-w-0 items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-accent-500 accent:text-white size-4 shrink-0"
			>
				<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
			</svg>
			<span
				class="text-base-900 dark:text-base-100 accent:text-white min-w-0 truncate text-sm font-semibold"
			>
				{room?.name ? `#${room.name}` : 'Roomy'}
			</span>
		</div>
		<a
			{href}
			target="_blank"
			rel="noopener noreferrer"
			class="text-base-500 hover:text-accent-500 dark:text-base-400 accent:text-white/70 accent:hover:text-white flex shrink-0 items-center gap-1 text-xs font-medium transition-colors"
		>
			Open
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="size-3"
			>
				<path d="M7 17 17 7M7 7h10v10" />
			</svg>
		</a>
	</div>

	<!-- Body -->
	{#if messages.length > 0}
		<div
			bind:this={scroller}
			class="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-3 pb-3"
		>
			{#each messages as message (message.id)}
				<div class="flex gap-2">
					{#if message.authorAvatar}
						<img
							src={message.authorAvatar}
							alt=""
							loading="lazy"
							class="bg-base-200 dark:bg-base-700 mt-0.5 size-6 shrink-0 rounded-full object-cover"
						/>
					{:else}
						<div
							class="bg-base-200 dark:bg-base-700 accent:bg-white/20 text-base-500 dark:text-base-400 accent:text-white mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold uppercase"
						>
							{message.authorName.slice(0, 2)}
						</div>
					{/if}
					<div class="min-w-0 flex-1">
						<div class="flex items-baseline gap-1.5">
							<span
								class="text-base-900 dark:text-base-100 accent:text-white truncate text-xs font-semibold"
							>
								{message.authorName}
							</span>
							{#if message.timestamp}
								<span
									class="text-base-400 dark:text-base-500 accent:text-white/50 shrink-0 text-[10px]"
								>
									{relativeTime(message.timestamp)}
								</span>
							{/if}
						</div>
						<div
							class="prose prose-sm dark:prose-invert prose-neutral prose-p:my-0.5 prose-p:first:mt-0 prose-p:last:mb-0 prose-a:text-accent-600 dark:prose-a:text-accent-400 accent:prose-a:text-white prose-a:no-underline prose-pre:my-1 prose-pre:text-[10px] prose-code:text-[11px] prose-blockquote:my-1 prose-blockquote:not-italic prose-ul:my-0.5 prose-ol:my-0.5 text-base-700 dark:text-base-300 accent:text-white/90 max-w-none text-xs leading-snug break-words"
						>
							<!-- eslint-disable-next-line svelte/no-at-html-tags -->
							{@html renderContent(message.content)}
						</div>
						{#if message.reactions.length > 0}
							<div class="mt-1 flex flex-wrap gap-1">
								{#each message.reactions as reaction (reaction.emoji)}
									<span
										class="bg-base-100 dark:bg-base-800 accent:bg-white/10 text-base-600 dark:text-base-300 accent:text-white inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px]"
									>
										{reaction.emoji}
										{reaction.dids.length}
									</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<div
			class="text-base-400 dark:text-base-500 accent:text-white/60 flex flex-1 items-center justify-center px-3 pb-3 text-center text-sm"
		>
			{#if loading}
				Loading messages…
			{:else if roomId}
				No messages yet.
			{:else}
				No room selected.
			{/if}
		</div>
	{/if}
</div>
