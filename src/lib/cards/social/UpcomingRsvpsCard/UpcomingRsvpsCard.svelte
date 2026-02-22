<script lang="ts">
	import { onMount } from 'svelte';
	import { Badge } from '@foxui/core';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import type { ContentComponentProps } from '../../types';
	import { CardDefinitionsByType } from '../..';
	import type { ResolvedRsvp } from '$lib/events/fetch-attendees';
	import { qrOverlay } from '$lib/components/qr/qrOverlay.svelte';

	let { item }: ContentComponentProps = $props();

	let isLoaded = $state(false);
	const data = getAdditionalUserData();
	const did = getDidContext();
	const handle = getHandleContext();

	// svelte-ignore state_referenced_locally
	let rsvps = $state<ResolvedRsvp[]>(
		((data['upcomingRsvps'] as { rsvps?: ResolvedRsvp[] })?.rsvps ?? []) as ResolvedRsvp[]
	);

	onMount(async () => {
		try {
			const loaded = await CardDefinitionsByType[item.cardType]?.loadData?.([item], {
				did,
				handle
			});
			const result = loaded as { rsvps?: ResolvedRsvp[] } | undefined;
			const freshRsvps = result?.rsvps ?? [];

			if (freshRsvps.length > 0) {
				rsvps = freshRsvps;
			}

			data['upcomingRsvps'] = { rsvps };
		} catch (e) {
			console.error('Failed to load RSVPs', e);
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
</script>

<div class="flex h-full flex-col overflow-hidden p-4">
	<div class="mb-3 flex items-center gap-2">
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
					d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
				/>
			</svg>
		</div>
		<span class="text-base-900 dark:text-base-50 text-sm font-semibold">RSVPs</span>
	</div>

	<div class="flex-1 overflow-y-auto">
		{#if rsvps.length > 0}
			<div class="flex flex-col gap-2">
				{#each rsvps as rsvp (rsvp.eventUri)}
					<a
						href="https://blento.app/{rsvp.hostDid}/events/{rsvp.rkey}"
						target="_blank"
						class="hover:bg-base-100 dark:hover:bg-base-800 accent:hover:bg-accent-400/20 flex flex-col gap-1 rounded-lg p-2 transition-colors"
						use:qrOverlay={{ context: { title: rsvp.event.name } }}
					>
						<div class="flex items-center gap-2">
							<span class="text-base-900 dark:text-base-50 line-clamp-1 flex-1 text-sm font-medium"
								>{rsvp.event.name}</span
							>
							<Badge size="sm" color={rsvp.status === 'going' ? 'green' : 'amber'}>
								<span class="accent:text-base-900"
									>{rsvp.status === 'going' ? 'Going' : 'Interested'}</span
								>
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
								class="size-3 shrink-0"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
								/>
							</svg>
							<span>{formatDate(rsvp.event.startsAt)} at {formatTime(rsvp.event.startsAt)}</span>
						</div>
						{#if rsvp.hostProfile}
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
										d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
									/>
								</svg>
								<span class="truncate"
									>{rsvp.hostProfile.displayName || rsvp.hostProfile.handle}</span
								>
							</div>
						{/if}
					</a>
				{/each}
			</div>
		{:else if isLoaded}
			<div
				class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
			>
				No upcoming RSVPs
			</div>
		{:else}
			<div
				class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
			>
				Loading RSVPs...
			</div>
		{/if}
	</div>
</div>
