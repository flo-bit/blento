<script lang="ts">
	import type { EventData } from '$lib/cards/social/EventCard';
	import { getCDNImageBlobUrl } from '$lib/atproto';
	import { Avatar as FoxAvatar, Badge } from '@foxui/core';
	import Avatar from 'svelte-boring-avatars';
	import EventRsvp from './EventRsvp.svelte';
	import { page } from '$app/state';

	let { data } = $props();

	let eventData: EventData = $derived(data.eventData);
	let did: string = $derived(data.did);
	let rkey: string = $derived(data.rkey);
	let hostProfile = $derived(data.hostProfile);

	let hostUrl = $derived(
		hostProfile?.url ?? `https://bsky.app/profile/${hostProfile?.handle || did}`
	);

	let startDate = $derived(new Date(eventData.startsAt));
	let endDate = $derived(eventData.endsAt ? new Date(eventData.endsAt) : null);

	function formatMonth(date: Date): string {
		return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
	}

	function formatDay(date: Date): number {
		return date.getDate();
	}

	function formatWeekday(date: Date): string {
		return date.toLocaleDateString('en-US', { weekday: 'long' });
	}

	function formatFullDate(date: Date): string {
		const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
		if (date.getFullYear() !== new Date().getFullYear()) {
			options.year = 'numeric';
		}
		return date.toLocaleDateString('en-US', options);
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
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

	function getLocationString(locations: EventData['locations']): string | undefined {
		if (!locations || locations.length === 0) return undefined;

		const loc = locations.find((v) => v.$type === 'community.lexicon.location.address');
		if (!loc) return undefined;

		// Handle both flat location objects (name, street, locality, country)
		// and nested address objects
		const flat = loc as Record<string, unknown>;
		const nested = loc.address;

		const street = (flat.street as string) || undefined;
		const locality = (flat.locality as string) || nested?.locality;
		const region = (flat.region as string) || nested?.region;

		const parts = [street, locality, region].filter(Boolean);
		return parts.length > 0 ? parts.join(', ') : undefined;
	}

	let location = $derived(getLocationString(eventData.locations));

	let headerImage = $derived.by(() => {
		if (!eventData.media || eventData.media.length === 0) return null;
		const media = eventData.media.find((m) => m.role === 'thumbnail');
		if (!media?.content) return null;
		const url = getCDNImageBlobUrl({ did, blob: media.content, type: 'jpeg' });
		if (!url) return null;
		return { url, alt: media.alt || eventData.name };
	});

	let smokesignalUrl = $derived(`https://smokesignal.events/${did}/${rkey}`);
	let eventUri = $derived(`at://${did}/community.lexicon.calendar.event/${rkey}`);

	let ogImageUrl = $derived(`${page.url.origin}${page.url.pathname}/og.png`);
</script>

<svelte:head>
	<title>{eventData.name}</title>
	<meta name="description" content={eventData.description || `Event: ${eventData.name}`} />
	<meta property="og:title" content={eventData.name} />
	<meta property="og:description" content={eventData.description || `Event: ${eventData.name}`} />
	<meta property="og:image" content={ogImageUrl} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={eventData.name} />
	<meta name="twitter:description" content={eventData.description || `Event: ${eventData.name}`} />
	<meta name="twitter:image" content={ogImageUrl} />
</svelte:head>

<div class="bg-base-50 dark:bg-base-950 min-h-screen px-6 py-12 sm:py-12">
	<div class="mx-auto max-w-4xl">
		<!-- Two-column layout: image left, details right -->
		<div
			class="grid grid-cols-1 gap-8 md:grid-cols-[14rem_1fr] md:gap-x-10 md:gap-y-6 lg:grid-cols-[16rem_1fr]"
		>
			<!-- Image -->
			<div class="order-1 max-w-sm md:order-0 md:col-start-1 md:max-w-none">
				{#if headerImage}
					<img
						src={headerImage.url}
						alt={headerImage.alt}
						class="border-base-200 dark:border-base-800 aspect-square w-full rounded-2xl border object-cover"
					/>
				{:else}
					<div
						class="border-base-200 dark:border-base-800 aspect-square w-full overflow-hidden rounded-2xl border [&>svg]:h-full [&>svg]:w-full"
					>
						<Avatar
							size={256}
							name={data.rkey}
							variant="marble"
							colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
							square
						/>
					</div>
				{/if}
			</div>

			<!-- Right column: event details -->
			<div class="order-2 min-w-0 md:order-0 md:col-start-2 md:row-span-5 md:row-start-1">
				<h1
					class="text-base-900 dark:text-base-50 mb-2 text-4xl leading-tight font-bold sm:text-5xl"
				>
					{eventData.name}
				</h1>

				<!-- Mode badge -->
				{#if eventData.mode}
					<div class="mb-8">
						<Badge size="md" variant={getModeColor(eventData.mode)}
							>{getModeLabel(eventData.mode)}</Badge
						>
					</div>
				{/if}

				<!-- Date row (Luma-style calendar icon) -->
				<div class="mb-4 flex items-center gap-4">
					<div
						class="border-base-200 dark:border-base-700 flex size-12 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border"
					>
						<span class="text-base-500 dark:text-base-400 text-[9px] leading-none font-semibold">
							{formatMonth(startDate)}
						</span>
						<span class="text-base-900 dark:text-base-50 text-lg leading-tight font-bold">
							{formatDay(startDate)}
						</span>
					</div>
					<div>
						<p class="text-base-900 dark:text-base-50 font-semibold">
							{formatWeekday(startDate)}, {formatFullDate(startDate)}
						</p>
						<p class="text-base-500 dark:text-base-400 text-sm">
							{formatTime(startDate)}
							{#if endDate}
								- {formatTime(endDate)}{/if}
						</p>
					</div>
				</div>

				<!-- Location row -->
				{#if location}
					<div class="mb-6 flex items-center gap-4">
						<div
							class="border-base-200 dark:border-base-700 flex size-12 shrink-0 items-center justify-center rounded-xl border"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="text-base-900 dark:text-base-200 size-5"
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
						</div>
						<p class="text-base-900 dark:text-base-50 font-semibold">{location}</p>
					</div>
				{/if}

				<EventRsvp {eventUri} eventCid={data.eventCid} />

				<!-- About Event -->
				{#if eventData.description}
					<div class="mt-8 mb-8">
						<p
							class="text-base-500 dark:text-base-400 mb-3 text-xs font-semibold tracking-wider uppercase"
						>
							About
						</p>
						<p class="text-base-700 dark:text-base-300 leading-relaxed whitespace-pre-wrap">
							{eventData.description}
						</p>
					</div>
				{/if}
			</div>

			<!-- Hosted By -->
			<div class="order-3 md:order-0 md:col-start-1">
				<p
					class="text-base-500 dark:text-base-400 mb-3 text-xs font-semibold tracking-wider uppercase"
				>
					Hosted By
				</p>
				<a
					href={hostUrl}
					target={hostProfile?.hasBlento ? undefined : '_blank'}
					rel={hostProfile?.hasBlento ? undefined : 'noopener noreferrer'}
					class="text-base-900 dark:text-base-100 flex items-center gap-2.5 font-medium hover:underline"
				>
					<FoxAvatar
						src={hostProfile?.avatar}
						alt={hostProfile?.displayName || hostProfile?.handle || did}
						class="size-8 shrink-0"
					/>
					<span class="truncate text-sm">
						{hostProfile?.displayName || hostProfile?.handle || did}
					</span>
				</a>
			</div>

			{#if eventData.uris && eventData.uris.length > 0}
				<!-- Links -->
				<div class="order-5 md:order-0 md:col-start-1">
					<p
						class="text-base-500 dark:text-base-400 mb-4 text-xs font-semibold tracking-wider uppercase"
					>
						Links
					</p>
					<div class="space-y-3">
						{#each eventData.uris as link (link.name + link.uri)}
							<a
								href={link.uri}
								target="_blank"
								rel="noopener noreferrer"
								class="text-base-700 dark:text-base-300 hover:text-base-900 dark:hover:text-base-100 flex items-center gap-1.5 text-sm transition-colors"
							>
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
										d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
									/>
								</svg>
								<span class="truncate">{link.name || link.uri.replace(/^https?:\/\//, '')}</span>
							</a>
						{/each}
					</div>
				</div>
			{/if}

			<!-- View on Smoke Signal link -->
			<a
				href={smokesignalUrl}
				target="_blank"
				rel="noopener noreferrer"
				class="text-base-500 dark:text-base-400 hover:text-base-700 dark:hover:text-base-200 order-6 inline-flex items-center gap-1.5 text-sm transition-colors md:order-0 md:col-start-2"
			>
				View on Smoke Signal
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
		</div>
	</div>
</div>
