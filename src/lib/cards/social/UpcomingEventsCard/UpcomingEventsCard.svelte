<script lang="ts">
	import { onMount } from 'svelte';
	import { Badge } from '@foxui/core';
	import {
		getAdditionalUserData,
		getDidContext,
		getHandleContext,
		getIsMobile
	} from '$lib/website/context';
	import type { ContentComponentProps } from '../../types';
	import { CardDefinitionsByType } from '../..';
	import type { EventData } from '../EventCard';
	import { user } from '$lib/atproto';
	import { qrOverlay } from '$lib/components/qr/qrOverlay.svelte';
	import * as TID from '@atcute/tid';

	let { item }: ContentComponentProps = $props();

	let isMobile = getIsMobile();
	let isLoaded = $state(false);
	const data = getAdditionalUserData();
	const did = getDidContext();
	const handle = getHandleContext();

	type EventWithRkey = EventData & { rkey: string };

	let events = $state<EventWithRkey[]>(
		((data['upcomingEvents'] as { events?: EventWithRkey[] })?.events ?? []) as EventWithRkey[]
	);

	onMount(async () => {
		try {
			const loaded = await CardDefinitionsByType[item.cardType]?.loadData?.([item], {
				did,
				handle
			});
			const result = loaded as { events?: EventWithRkey[] } | undefined;
			const freshEvents = result?.events ?? [];

			if (freshEvents.length > 0) {
				events = freshEvents;
			}

			data['upcomingEvents'] = { events };
		} catch (e) {
			console.error('Failed to load upcoming events', e);
		}

		isLoaded = true;
	});

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
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

	let isOwner = $derived(user.isLoggedIn && user.did === did);
	let isRefreshing = $state(false);

	async function refreshEvents() {
		isRefreshing = true;
		try {
			const loaded = await CardDefinitionsByType[item.cardType]?.loadData?.([item], {
				did,
				handle
			});
			const result = loaded as { events?: EventWithRkey[] } | undefined;
			const freshEvents = result?.events ?? [];
			events = freshEvents;
			data['upcomingEvents'] = { events };
		} catch (e) {
			console.error('Failed to refresh events', e);
		}
		isRefreshing = false;
	}
</script>

<div class="flex h-full flex-col overflow-hidden p-4">
	<!-- Header row -->
	<div class="mb-3 flex items-center justify-between">
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
			<span class="text-base-900 dark:text-base-50 text-sm font-semibold">Events</span>
		</div>
		{#if isOwner}
			<div class="flex items-center gap-1">
				<button
					onclick={refreshEvents}
					disabled={isRefreshing}
					title="Refresh events"
					class="bg-base-100 hover:bg-base-200 dark:bg-base-800 dark:hover:bg-base-700 accent:bg-accent-400/30 accent:hover:bg-accent-400/50 text-base-700 dark:text-base-300 z-50 flex size-7 items-center justify-center rounded-lg transition-colors disabled:opacity-50"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="size-4"
						class:animate-spin={isRefreshing}
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M20.016 4.657v4.992"
						/>
					</svg>
				</button>
				<a
					href="/{handle}/events/{TID.now()}/edit"
					target="_blank"
					title="Create new event"
					class="bg-base-100 hover:bg-base-200 dark:bg-base-800 dark:hover:bg-base-700 accent:bg-accent-400/30 accent:hover:bg-accent-400/50 text-base-700 dark:text-base-300 z-50 flex size-7 items-center justify-center rounded-lg transition-colors"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="2"
						stroke="currentColor"
						class="size-4"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
				</a>
			</div>
		{/if}
	</div>

	<!-- Scrollable list -->
	<div class="flex-1 overflow-y-auto">
		{#if events.length > 0}
			<div class="flex flex-col gap-2">
				{#each events as event (event.rkey)}
					<a
						href="https://blento.app/{did}/events/{event.rkey}"
						target="_blank"
						class="hover:bg-base-100 dark:hover:bg-base-800 accent:hover:bg-accent-400/20 flex flex-col gap-1 rounded-lg p-2 transition-colors"
						use:qrOverlay={{ context: { title: event.name } }}
					>
						<div class="flex items-center gap-2">
							<span class="text-base-900 dark:text-base-50 line-clamp-1 flex-1 text-sm font-medium"
								>{event.name}</span
							>
							<Badge size="sm" color={getModeColor(event.mode)}>
								<span class="accent:text-base-900">{getModeLabel(event.mode)}</span>
							</Badge>
						</div>
						<div
							class="text-base-500 dark:text-base-400 accent:text-base-800 flex items-center gap-1 text-xs"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="size-3"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
								/>
							</svg>
							<span>{formatDate(event.startsAt)} at {formatTime(event.startsAt)}</span>
						</div>
						{#if event.locations && event.locations.length > 0}
							{@const loc = event.locations[0]?.address}
							{#if loc}
								{@const parts = [loc.locality, loc.region, loc.country].filter(Boolean)}
								{#if parts.length > 0}
									<div
										class="text-base-500 dark:text-base-400 accent:text-base-800 flex items-center gap-1 text-xs"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.5"
											stroke="currentColor"
											class="size-3 shrink-0"
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
										<span class="truncate">{parts.join(', ')}</span>
									</div>
								{/if}
							{/if}
						{/if}
					</a>
				{/each}
			</div>
		{:else if isLoaded}
			<div
				class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
			>
				No upcoming events
			</div>
		{:else}
			<div
				class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
			>
				Loading events...
			</div>
		{/if}
	</div>
</div>
