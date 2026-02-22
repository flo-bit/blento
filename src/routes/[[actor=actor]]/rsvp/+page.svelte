<script lang="ts">
	import type { EventData } from '$lib/cards/social/EventCard';
	import { getCDNImageBlobUrl } from '$lib/atproto';
	import { Avatar as FoxAvatar, Badge, Button, toast } from '@foxui/core';
	import { page } from '$app/state';
	import Avatar from 'svelte-boring-avatars';
	import type { CachedProfile } from '$lib/cache';

	let { data } = $props();

	let rsvps: Array<{
		event: EventData;
		rkey: string;
		hostDid: string;
		hostProfile: CachedProfile | null;
		status: string;
		eventUri: string;
	}> = $derived(data.rsvps);
	let did: string = $derived(data.did);
	let userProfile = $derived(data.userProfile);

	let userName = $derived(userProfile?.displayName || userProfile?.handle || did);

	function formatDate(dateStr: string): string {
		const date = new Date(dateStr);
		const options: Intl.DateTimeFormatOptions = {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		};
		if (date.getFullYear() !== new Date().getFullYear()) {
			options.year = 'numeric';
		}
		return date.toLocaleDateString('en-US', options);
	}

	function formatTime(dateStr: string): string {
		return new Date(dateStr).toLocaleTimeString('en-US', {
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

	function getModeColor(mode: string): 'cyan' | 'purple' | 'amber' | 'secondary' {
		if (mode.includes('virtual')) return 'cyan';
		if (mode.includes('hybrid')) return 'purple';
		if (mode.includes('inperson')) return 'amber';
		return 'secondary';
	}

	function getThumbnail(event: EventData, hostDid: string): { url: string; alt: string } | null {
		if (!event.media || event.media.length === 0) return null;
		const media = event.media.find((m) => m.role === 'thumbnail');
		if (!media?.content) return null;
		const url = getCDNImageBlobUrl({ did: hostDid, blob: media.content, type: 'jpeg' });
		if (!url) return null;
		return { url, alt: media.alt || event.name };
	}

	function getStatusLabel(status: string): string {
		return status === 'going' ? 'Going' : 'Interested';
	}

	function getStatusColor(status: string): 'green' | 'blue' {
		return status === 'going' ? 'green' : 'blue';
	}

	let showPast: boolean = $state(false);
	let now = $derived(new Date());
	let filteredRsvps = $derived(
		rsvps.filter((r) => {
			const endOrStart = r.event.endsAt || r.event.startsAt;
			const eventDate = new Date(endOrStart);
			return showPast ? eventDate < now : eventDate >= now;
		})
	);
</script>

<svelte:head>
	<title>{userName} - RSVPs</title>
	<meta name="description" content="Events {userName} is attending" />
	<meta property="og:title" content="{userName} - RSVPs" />
	<meta property="og:description" content="Events {userName} is attending" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="{userName} - RSVPs" />
	<meta name="twitter:description" content="Events {userName} is attending" />
</svelte:head>

<div class="min-h-screen px-6 py-12 sm:py-12">
	<div class="mx-auto max-w-3xl">
		<!-- Header -->
		<div class="mb-8 flex items-start justify-between">
			<div>
				<h1 class="text-base-900 dark:text-base-50 mb-2 text-2xl font-bold sm:text-3xl">
					{showPast ? 'Past' : 'Upcoming'} RSVPs
				</h1>
				<div class="mt-4 flex items-center gap-2">
					<FoxAvatar src={userProfile?.avatar} alt={userName} class="size-5 shrink-0" />
					<span class="text-base-900 dark:text-base-100 text-sm font-medium">{userName}</span>
				</div>
			</div>
			<Button
				variant="secondary"
				onclick={async () => {
					const calendarUrl = `${page.url.origin}${page.url.pathname.replace(/\/$/, '')}/calendar`;
					await navigator.clipboard.writeText(calendarUrl);
					toast.success('Subscription link copied to clipboard');
				}}>Subscribe</Button
			>
		</div>

		<!-- Toggle -->
		<div class="mb-6 flex gap-1">
			<button
				class="rounded-xl px-3 py-1.5 text-sm font-medium transition-colors {!showPast
					? 'bg-base-200 dark:bg-base-800 text-base-900 dark:text-base-50'
					: 'text-base-500 dark:text-base-400 hover:text-base-700 dark:hover:text-base-200  cursor-pointer'}"
				onclick={() => (showPast = false)}>Upcoming</button
			>
			<button
				class="rounded-xl px-3 py-1.5 text-sm font-medium transition-colors {showPast
					? 'bg-base-200 dark:bg-base-800 text-base-900 dark:text-base-50'
					: 'text-base-500 dark:text-base-400 hover:text-base-700 dark:hover:text-base-200  cursor-pointer'}"
				onclick={() => (showPast = true)}>Past</button
			>
		</div>

		{#if filteredRsvps.length === 0}
			<p class="text-base-500 dark:text-base-400 py-12 text-center">
				No {showPast ? 'past' : 'upcoming'} RSVPs.
			</p>
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each filteredRsvps as rsvp (rsvp.eventUri)}
					{@const thumbnail = getThumbnail(rsvp.event, rsvp.hostDid)}
					{@const hostHandle = rsvp.hostProfile?.handle || rsvp.hostDid}
					<a
						href="/{hostHandle}/events/{rsvp.rkey}"
						class="border-base-200 dark:border-base-800 hover:border-base-300 dark:hover:border-base-700 group bg-base-100 dark:bg-base-950 block overflow-hidden rounded-2xl border transition-colors"
					>
						<!-- Thumbnail -->
						<div class="p-4">
							{#if thumbnail}
								<img
									src={thumbnail.url}
									alt={thumbnail.alt}
									class="aspect-square w-full rounded-2xl object-cover"
								/>
							{:else}
								<div
									class="bg-base-100 dark:bg-base-900 aspect-square w-full overflow-hidden rounded-2xl [&>svg]:h-full [&>svg]:w-full"
								>
									<Avatar
										size={400}
										name={rsvp.rkey}
										variant="marble"
										colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
										square
									/>
								</div>
							{/if}
						</div>

						<!-- Content -->
						<div class="p-4">
							<h2
								class="text-base-900 dark:text-base-50 group-hover:text-base-700 dark:group-hover:text-base-200 mb-1 leading-snug font-semibold"
							>
								{rsvp.event.name}
							</h2>

							<p class="text-base-500 dark:text-base-400 mb-2 text-sm">
								{formatDate(rsvp.event.startsAt)} &middot; {formatTime(rsvp.event.startsAt)}
							</p>

							<div class="flex flex-wrap items-center gap-2">
								{#if rsvp.event.mode}
									<Badge size="sm" variant={getModeColor(rsvp.event.mode)}
										>{getModeLabel(rsvp.event.mode)}</Badge
									>
								{/if}

								<Badge size="sm" variant={getStatusColor(rsvp.status)}
									>{getStatusLabel(rsvp.status)}</Badge
								>
							</div>
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
