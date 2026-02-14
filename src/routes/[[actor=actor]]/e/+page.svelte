<script lang="ts">
	import type { EventData } from '$lib/cards/social/EventCard';
	import { getCDNImageBlobUrl } from '$lib/atproto';
	import { Avatar as FoxAvatar, Badge } from '@foxui/core';
	import Avatar from 'svelte-boring-avatars';

	let { data } = $props();

	let events: EventData[] = $derived(data.events);
	let did: string = $derived(data.did);
	let hostProfile = $derived(data.hostProfile);

	let hostName = $derived(hostProfile?.displayName || hostProfile?.handle || did);
	let hostUrl = $derived(
		hostProfile?.url ?? `https://bsky.app/profile/${hostProfile?.handle || did}`
	);

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

	function getLocationString(locations: EventData['locations']): string | undefined {
		if (!locations || locations.length === 0) return undefined;

		const loc = locations.find((v) => v.$type === 'community.lexicon.location.address');
		if (!loc) return undefined;

		const flat = loc as Record<string, unknown>;
		const nested = loc.address;

		const locality = (flat.locality as string) || nested?.locality;
		const region = (flat.region as string) || nested?.region;

		const parts = [locality, region].filter(Boolean);
		return parts.length > 0 ? parts.join(', ') : undefined;
	}

	function getThumbnail(event: EventData): { url: string; alt: string } | null {
		if (!event.media || event.media.length === 0) return null;
		const media = event.media.find((m) => m.role === 'thumbnail');
		if (!media?.content) return null;
		const url = getCDNImageBlobUrl({ did, blob: media.content, type: 'jpeg' });
		if (!url) return null;
		return { url, alt: media.alt || event.name };
	}

	function getRkey(event: EventData): string {
		return event.url.split('/').pop() || '';
	}

	let actorPrefix = $derived(data.hostProfile?.handle ? `/${data.hostProfile.handle}` : `/${did}`);
</script>

<svelte:head>
	<title>{hostName} - Events</title>
	<meta name="description" content="Events hosted by {hostName}" />
	<meta property="og:title" content="{hostName} - Events" />
	<meta property="og:description" content="Events hosted by {hostName}" />
	<meta name="twitter:card" content="summary" />
	<meta name="twitter:title" content="{hostName} - Events" />
	<meta name="twitter:description" content="Events hosted by {hostName}" />
</svelte:head>

<div class="bg-base-50 dark:bg-base-950 min-h-screen px-6 py-12 sm:py-12">
	<div class="mx-auto max-w-4xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-base-900 dark:text-base-50 mb-2 text-2xl font-bold sm:text-3xl">
				Upcoming events
			</h1>
			<div class="mt-4 flex items-center gap-2">
				<span class="text-base-500 dark:text-base-400 text-sm">Hosted by</span>
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

		{#if events.length === 0}
			<p class="text-base-500 dark:text-base-400 py-12 text-center">No events found.</p>
		{:else}
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each events as event (event.url)}
					{@const thumbnail = getThumbnail(event)}
					{@const location = getLocationString(event.locations)}
					{@const rkey = getRkey(event)}
					<a
						href="{actorPrefix}/e/{rkey}"
						class="border-base-200 dark:border-base-800 hover:border-base-300 dark:hover:border-base-700 group block overflow-hidden rounded-xl border transition-colors"
					>
						<!-- Thumbnail -->
						{#if thumbnail}
							<img
								src={thumbnail.url}
								alt={thumbnail.alt}
								class="aspect-square w-full object-cover"
							/>
						{:else}
							<div
								class="bg-base-100 dark:bg-base-900 aspect-square w-full [&>svg]:h-full [&>svg]:w-full"
							>
								<Avatar
									size={400}
									name={rkey}
									variant="marble"
									colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
									square
								/>
							</div>
						{/if}

						<!-- Content -->
						<div class="p-4">
							<h2
								class="text-base-900 dark:text-base-50 group-hover:text-base-700 dark:group-hover:text-base-200 mb-1 leading-snug font-semibold"
							>
								{event.name}
							</h2>

							<p class="text-base-500 dark:text-base-400 mb-2 text-sm">
								{formatDate(event.startsAt)} &middot; {formatTime(event.startsAt)}
							</p>

							<div class="flex flex-wrap items-center gap-2">
								{#if event.mode}
									<Badge size="sm" variant={getModeColor(event.mode)}
										>{getModeLabel(event.mode)}</Badge
									>
								{/if}

								{#if location}
									<span class="text-base-500 dark:text-base-400 truncate text-xs">{location}</span>
								{/if}
							</div>

							{#if event.countGoing && event.countGoing > 0}
								<p class="text-base-500 dark:text-base-400 mt-2 text-xs">
									{event.countGoing} going
								</p>
							{/if}
						</div>
					</a>
				{/each}
			</div>
		{/if}
	</div>
</div>
