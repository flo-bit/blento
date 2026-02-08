<script lang="ts">
	import { onMount } from 'svelte';
	import { siLastdotfm } from 'simple-icons';
	import { getAdditionalUserData } from '$lib/website/context';
	import type { ContentComponentProps } from '../../../types';
	import { qrOverlay } from '$lib/components/qr/qrOverlay.svelte';
	import { fetchLastFM } from '../api.remote';

	interface UserInfo {
		name: string;
		realname: string;
		url: string;
		image: { '#text': string; size: string }[];
		playcount: string;
		registered: { unixtime: string };
	}

	let { item, isEditing }: ContentComponentProps = $props();

	const data = getAdditionalUserData();
	const cacheKey = $derived(`lastfmProfile:${item.cardData.lastfmUsername}`);

	// svelte-ignore state_referenced_locally
	let userInfo = $state(data[cacheKey] as UserInfo | undefined);

	onMount(async () => {
		if (userInfo) return;
		if (!item.cardData.lastfmUsername) return;

		try {
			const result = await fetchLastFM({
				method: 'user.getInfo',
				user: item.cardData.lastfmUsername
			});
			if (result) {
				userInfo = result?.user;
				data[cacheKey] = userInfo;
			}
		} catch (error) {
			console.error('Failed to fetch Last.fm profile:', error);
		}
	});

	const profileUrl = $derived(`https://www.last.fm/user/${item.cardData.lastfmUsername}`);

	const avatarUrl = $derived.by(() => {
		if (!userInfo?.image) return '';
		const preferred = ['extralarge', 'large', 'medium'];
		for (const pref of preferred) {
			const img = userInfo.image.find((i) => i.size === pref);
			if (img?.['#text']) return img['#text'];
		}
		return '';
	});

	const memberSince = $derived.by(() => {
		if (!userInfo?.registered?.unixtime) return '';
		const date = new Date(parseInt(userInfo.registered.unixtime) * 1000);
		return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
	});
</script>

<div class="h-full overflow-hidden p-4">
	<div class="flex h-full flex-col justify-between">
		<div class="flex items-center gap-3">
			<div
				class="fill-base-950 accent:fill-white size-6 shrink-0 dark:fill-white [&_svg]:size-full"
			>
				{@html siLastdotfm.svg}
			</div>
			<span class="truncate text-2xl font-bold">
				{item.cardData.lastfmUsername}
			</span>
		</div>

		{#if userInfo}
			<div class="flex items-center gap-4">
				{#if avatarUrl}
					<img src={avatarUrl} alt={userInfo.name} class="size-12 rounded-full object-cover" />
				{/if}
				<div class="min-w-0 flex-1">
					<div class="text-lg font-semibold">
						{parseInt(userInfo.playcount).toLocaleString()} scrobbles
					</div>
					{#if memberSince}
						<div class="text-sm opacity-60">
							Since {memberSince}
						</div>
					{/if}
				</div>
			</div>
		{:else}
			<div class="text-sm opacity-60">Loading profile...</div>
		{/if}
	</div>
</div>

{#if !isEditing}
	<a
		href={profileUrl}
		class="absolute inset-0 h-full w-full"
		target="_blank"
		rel="noopener noreferrer"
		use:qrOverlay={{
			context: {
				title: item.cardData.lastfmUsername,
				icon: siLastdotfm.svg,
				iconColor: '#' + siLastdotfm.hex
			}
		}}
	>
		<span class="sr-only">View on Last.fm</span>
	</a>
{/if}
