<script lang="ts">
	import { Alert, Button, Subheading } from '@foxui/core';
	import Modal from '$lib/components/modal/Modal.svelte';
	import type { CreationModalComponentProps } from '../../types';
	import { listRecords } from '$lib/atproto/methods';
	import { user } from '$lib/atproto';
	import type { Did } from '@atcute/lexicons';
	import type { EventData } from '.';
	import { onMount } from 'svelte';
	import { getAdditionalUserData } from '$lib/website/context';

	const EVENT_COLLECTION = 'community.lexicon.calendar.event';

	let { item = $bindable(), oncreate, oncancel }: CreationModalComponentProps = $props();

	const additionalData = getAdditionalUserData();

	type EventRecord = EventData & { uri: string };

	let isLoading = $state(true);
	let isRefreshing = $state(false);
	let events = $state<EventRecord[]>([]);
	let errorMessage = $state('');
	let searchOpen = $state(false);
	let searchValue = $state('');
	let searchInput = $state<HTMLInputElement | undefined>(undefined);

	const filteredEvents = $derived.by(() => {
		const q = searchValue.trim().toLowerCase();
		if (!q) return events;
		return events.filter((e) => e.name?.toLowerCase().includes(q));
	});

	async function toggleSearch() {
		searchOpen = !searchOpen;
		if (searchOpen) {
			await Promise.resolve();
			searchInput?.focus();
		} else {
			searchValue = '';
		}
	}

	async function loadEvents() {
		if (!user.did) {
			errorMessage = 'You need to be logged in to create an event card.';
			return;
		}

		errorMessage = '';

		try {
			const records = await listRecords({
				did: user.did as Did,
				collection: EVENT_COLLECTION,
				limit: 100
			});

			const now = Date.now();
			events = records
				.map((record) => ({
					...(record.value as EventData),
					uri: record.uri as string
				}))
				.sort((a, b) => {
					const aTime = new Date(a.startsAt).getTime();
					const bTime = new Date(b.startsAt).getTime();
					const aUpcoming = aTime >= now;
					const bUpcoming = bTime >= now;
					if (aUpcoming && !bUpcoming) return -1;
					if (!aUpcoming && bUpcoming) return 1;
					return aUpcoming ? aTime - bTime : bTime - aTime;
				});
		} catch (err) {
			console.error('Failed to load events', err);
			errorMessage = 'Failed to load your events. Please try again.';
		}
	}

	onMount(async () => {
		await loadEvents();
		isLoading = false;
	});

	async function refreshEvents() {
		if (isRefreshing) return;
		isRefreshing = true;
		await loadEvents();
		isRefreshing = false;
	}

	function pickEvent(event: EventRecord) {
		item.cardData.uri = event.uri;

		const { uri: _uri, ...eventData } = event;
		const bucket = (additionalData[item.cardType] as Record<string, EventData> | undefined) ?? {};
		bucket[item.id] = eventData as EventData;
		additionalData[item.cardType] = bucket;

		oncreate();
	}

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<Modal open={true} closeButton={false} class="flex max-h-[85vh] flex-col overflow-hidden">
	<div class="flex min-h-0 flex-1 flex-col gap-3">
		<div class="flex items-center justify-between gap-2">
			<Subheading>Choose an event or create a new one</Subheading>
			<div class="flex items-center gap-1">
				<button
					type="button"
					onclick={toggleSearch}
					title="Search events"
					aria-label="Search events"
					aria-pressed={searchOpen}
					class="bg-base-100 hover:bg-base-200 dark:bg-base-800 dark:hover:bg-base-700 text-base-700 dark:text-base-300 aria-pressed:bg-accent-500/20 aria-pressed:text-accent-700 dark:aria-pressed:text-accent-300 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors"
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
							d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
						/>
					</svg>
				</button>
				<button
					type="button"
					onclick={refreshEvents}
					disabled={isRefreshing || isLoading}
					title="Refresh events"
					aria-label="Refresh events"
					class="bg-base-100 hover:bg-base-200 dark:bg-base-800 dark:hover:bg-base-700 text-base-700 dark:text-base-300 flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:opacity-50"
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
					href="/event/create"
					target="_blank"
					rel="noopener"
					title="Create new event"
					aria-label="Create new event"
					class="bg-base-100 hover:bg-base-200 dark:bg-base-800 dark:hover:bg-base-700 text-base-700 dark:text-base-300 flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors"
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
		</div>

		{#if searchOpen}
			<input
				bind:this={searchInput}
				bind:value={searchValue}
				type="text"
				placeholder="Search events..."
				class="border-base-200 bg-base-50 placeholder:text-base-400 focus:border-accent-500 dark:border-base-700 dark:bg-base-900/60 dark:placeholder:text-base-500 dark:focus:border-accent-500 w-full rounded-xl border px-3 py-2 text-sm focus:ring-0 focus:outline-none"
			/>
		{/if}

		{#if isLoading}
			<p class="text-base-500 dark:text-base-400 text-sm">Loading your events...</p>
		{:else if errorMessage}
			<Alert type="error" title="Failed to load events"><span>{errorMessage}</span></Alert>
		{:else if events.length === 0}
			<Alert type="info" title="No events found">
				<span
					>You haven't created any events yet. Create one on atmo.rsvp first (it might take a few
					minutes to show up).</span
				>
			</Alert>
		{:else if filteredEvents.length === 0}
			<p class="text-base-500 dark:text-base-400 text-sm">No events match your search.</p>
		{:else}
			<div class="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
				{#each filteredEvents as event (event.uri)}
					<button
						type="button"
						class="border-base-200 bg-base-50 hover:border-accent-500 hover:bg-accent-50 dark:border-base-700 dark:bg-base-900/60 dark:hover:border-accent-500 dark:hover:bg-accent-950/40 group flex flex-col gap-1 rounded-xl border p-3 text-left transition-colors"
						onclick={() => pickEvent(event)}
					>
						<span
							class="text-base-900 dark:text-base-50 group-hover:text-accent-700 dark:group-hover:text-accent-300 line-clamp-1 text-sm font-semibold"
							>{event.name}</span
						>
						<div class="text-base-600 dark:text-base-400 flex items-center gap-1 text-xs">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="size-3.5 shrink-0"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
								/>
							</svg>
							<span>{formatDate(event.startsAt)}</span>
						</div>
					</button>
				{/each}
			</div>
		{/if}

		<div class="mt-2 flex justify-end gap-2">
			<Button onclick={oncancel} variant="ghost">Cancel</Button>
		</div>
	</div>
</Modal>
