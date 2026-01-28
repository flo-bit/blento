<script lang="ts">
	import { onMount } from 'svelte';
	import { Badge, Button } from '@foxui/core';
	import { getAdditionalUserData, getIsMobile } from '$lib/website/context';
	import type { ContentComponentProps } from '../types';
	import { CardDefinitionsByType } from '..';
	import type { EventData } from '.';
	import { parseUri } from '$lib/atproto';
	import { browser } from '$app/environment';
	import { qrOverlay } from '$lib/components/qr/qrOverlay.svelte';
	import type { Did } from '@atcute/lexicons';

	let { item }: ContentComponentProps = $props();

	let isMobile = getIsMobile();
	let isLoaded = $state(false);
	let fetchedEventData = $state<EventData | undefined>(undefined);

	const data = getAdditionalUserData();

	let eventData = $derived(
		fetchedEventData ||
			((data[item.cardType] as Record<string, EventData> | undefined)?.[item.id] as
				| EventData
				| undefined)
	);

	let parsedUri = $derived(item.cardData?.uri ? parseUri(item.cardData.uri) : null);

	onMount(async () => {
		if (!eventData && item.cardData?.uri && parsedUri?.repo) {
			const loadedData = (await CardDefinitionsByType[item.cardType]?.loadData?.([item], {
				did: parsedUri.repo as Did,
				handle: ''
			})) as Record<string, EventData> | undefined;

			if (loadedData?.[item.id]) {
				fetchedEventData = loadedData[item.id];
				if (!data[item.cardType]) {
					data[item.cardType] = {};
				}
				(data[item.cardType] as Record<string, EventData>)[item.id] = fetchedEventData;
			}
		}
		isLoaded = true;
	});

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatTime(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function getModeLabel(mode: string): string {
		if (mode.includes('virtual')) return 'Virtual';
		if (mode.includes('hybrid')) return 'Hybrid';
		if (mode.includes('inperson')) return 'In-Person';
		return 'Event';
	}

	function getModeColor(mode: string): string {
		if (mode.includes('virtual')) return 'blue';
		if (mode.includes('hybrid')) return 'purple';
		if (mode.includes('inperson')) return 'green';
		return 'gray';
	}

	function getLocationString(
		locations:
			| Array<{ address?: { locality?: string; region?: string; country?: string } }>
			| undefined
	): string | undefined {
		if (!locations || locations.length === 0) return undefined;
		const loc = locations[0]?.address;
		if (!loc) return undefined;

		const parts = [loc.locality, loc.region, loc.country].filter(Boolean);
		return parts.length > 0 ? parts.join(', ') : undefined;
	}

	let eventUrl = $derived(() => {
		if (eventData?.url) return eventData.url;
		if (parsedUri) {
			return `https://smokesignal.events/${parsedUri.repo}/${parsedUri.rkey}`;
		}
		return '#';
	});

	let location = $derived(getLocationString(eventData?.locations));

	let headerImage = $derived(() => {
		if (!eventData?.media || !parsedUri) return null;
		const header = eventData.media.find((m) => m.role === 'header');
		if (!header?.content?.ref?.$link) return null;
		return {
			url: `https://cdn.bsky.app/img/feed_thumbnail/plain/${parsedUri.repo}/${header.content.ref.$link}@jpeg`,
			alt: header.alt || eventData.name
		};
	});

	let showImage = $derived(
		browser && headerImage() && ((isMobile() && item.mobileH >= 8) || (!isMobile() && item.h >= 4))
	);
</script>

<div class="flex h-full flex-col justify-between overflow-hidden p-4">
	{#if eventData}
		<div class="min-w-0 flex-1 overflow-hidden">
			<div class="mb-2 flex items-center justify-between gap-2">
				<div class="flex items-center gap-2">
					<div
						class="bg-base-100 border-base-300 accent:bg-accent-100/50 accent:border-accent-200 dark:border-base-800 dark:bg-base-900 flex size-8 shrink-0 items-center justify-center rounded-xl border"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="size-4"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
							/>
						</svg>
					</div>
					<Badge size="sm" color={getModeColor(eventData.mode)}>
						<span class="accent:text-base-900">{getModeLabel(eventData.mode)}</span>
					</Badge>
				</div>

				{#if isMobile() ? item.mobileW > 4 : item.w > 2}
					<Button href={eventUrl()} target="_blank" rel="noopener noreferrer" class="z-50"
						>View event</Button
					>
				{/if}
			</div>

			<h3 class="text-base-900 dark:text-base-50 mb-2 line-clamp-2 text-lg leading-tight font-bold">
				{eventData.name}
			</h3>

			<div class="text-base-600 dark:text-base-400 accent:text-base-800 mb-2 text-sm">
				<div class="flex items-center gap-1">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4 shrink-0"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
						/>
					</svg>
					<span class="truncate">
						{formatDate(eventData.startsAt)} at {formatTime(eventData.startsAt)}
						{#if eventData.endsAt}
							- {formatDate(eventData.endsAt)}
						{/if}
					</span>
				</div>
			</div>

			{#if location}
				<div
					class="text-base-600 dark:text-base-400 accent:text-base-800 mb-2 flex items-center gap-1 text-sm"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
						class="size-4 shrink-0"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
						/>
					</svg>
					<span class="truncate">{location}</span>
				</div>
			{/if}

			{#if eventData.description && ((isMobile() && item.mobileH >= 5) || (!isMobile() && item.h >= 3))}
				<p class="text-base-500 dark:text-base-400 accent:text-base-900 mb-3 line-clamp-3 text-sm">
					{eventData.description}
				</p>
			{/if}

			{#if (eventData.countGoing !== undefined || eventData.countInterested !== undefined) && ((isMobile() && item.mobileH >= 4) || (!isMobile() && item.h >= 3))}
				<div
					class="text-base-600 dark:text-base-400 accent:text-base-800 flex flex-wrap gap-3 text-xs"
				>
					{#if eventData.countGoing !== undefined}
						<div class="flex items-center gap-1">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="size-4"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
								/>
							</svg>
							<span>{eventData.countGoing} going</span>
						</div>
					{/if}
					{#if eventData.countInterested !== undefined}
						<div class="flex items-center gap-1">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="size-4"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
								/>
							</svg>
							<span>{eventData.countInterested} interested</span>
						</div>
					{/if}
				</div>
			{/if}
		</div>

		{#if showImage}
			{@const img = headerImage()}
			{#if img}
				<img src={img.url} alt={img.alt} class="mt-3 aspect-3/1 w-full rounded-xl object-cover" />
			{/if}
		{/if}

		<a
			href={eventUrl()}
			class="absolute inset-0 h-full w-full"
			target="_blank"
			rel="noopener noreferrer"
			use:qrOverlay={{
				context: {
					title: eventData?.name ?? ''
				}
			}}
		>
			<span class="sr-only">View event on smokesignal.events</span>
		</a>
	{:else if isLoaded}
		<div class="flex h-full w-full items-center justify-center">
			<span class="text-base-500 dark:text-base-400">Event not found</span>
		</div>
	{:else}
		<div class="flex h-full w-full items-center justify-center">
			<span class="text-base-500 dark:text-base-400">Loading event...</span>
		</div>
	{/if}
</div>
