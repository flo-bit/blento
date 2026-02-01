<script lang="ts">
	import { onMount } from 'svelte';
	import type { ContentComponentProps } from '../types';
	import { getAdditionalUserData, getCanEdit, getIsMobile } from '$lib/website/context';
	import { getBlentoOrBskyProfile } from '$lib/atproto/methods';
	import type { FriendsProfile } from '.';
	import type { Did } from '@atcute/lexicons';
	import { Avatar } from '@foxui/core';

	let { item }: ContentComponentProps = $props();

	const isMobile = getIsMobile();
	const canEdit = getCanEdit();
	const additionalData = getAdditionalUserData();

	let dids: string[] = $derived(item.cardData.friends ?? []);

	let serverProfiles: FriendsProfile[] = $derived(
		(additionalData[item.cardType] as FriendsProfile[]) ?? []
	);

	let clientProfiles: FriendsProfile[] = $state([]);

	let profiles = $derived.by(() => {
		if (serverProfiles.length > 0) {
			return dids
				.map((did) => serverProfiles.find((p) => p.did === did))
				.filter((p): p is FriendsProfile => !!p);
		}
		return dids
			.map((did) => clientProfiles.find((p) => p.did === did))
			.filter((p): p is FriendsProfile => !!p);
	});

	onMount(() => {
		if (serverProfiles.length === 0 && dids.length > 0) {
			loadProfiles();
		}
	});

	async function loadProfiles() {
		const results = await Promise.all(
			dids.map((did) => getBlentoOrBskyProfile({ did: did as Did }).catch(() => undefined))
		);
		clientProfiles = results.filter(
			(p): p is FriendsProfile => !!p && p.handle !== 'handle.invalid'
		);
	}

	// Reload when dids change in editing mode
	$effect(() => {
		if (canEdit() && dids.length > 0) {
			loadProfiles();
		}
	});

	let sizeClass = $derived.by(() => {
		const w = isMobile() ? item.mobileW / 2 : item.w;
		if (w < 3) return 'sm';
		if (w < 5) return 'md';
		return 'lg';
	});

	function removeFriend(did: string) {
		item.cardData.friends = item.cardData.friends.filter((d: string) => d !== did);
	}

	function getLink(profile: FriendsProfile): string {
		if (profile.hasBlento && profile.handle && profile.handle !== 'handle.invalid') {
			return `/${profile.handle}`;
		}
		if (profile.handle && profile.handle !== 'handle.invalid') {
			return `https://bsky.app/profile/${profile.handle}`;
		}
		return `https://bsky.app/profile/${profile.did}`;
	}
</script>

<div class="flex h-full w-full items-center justify-center overflow-hidden px-2">
	{#if dids.length === 0}
		{#if canEdit()}
			<span class="text-base-400 dark:text-base-500 accent:text-accent-300 text-sm">
				Add friends in settings
			</span>
		{/if}
	{:else}
		{@const olX = sizeClass === 'sm' ? 12 : sizeClass === 'md' ? 20 : 24}
		{@const olY = sizeClass === 'sm' ? 8 : sizeClass === 'md' ? 12 : 16}
		<div class="">
			<div class="flex flex-wrap items-center justify-center" style="padding: {olY}px 0 0 {olX}px;">
				{#each profiles as profile (profile.did)}
					<div class="group relative" style="margin: -{olY}px 0 0 -{olX}px;">
						<a
							href={getLink(profile)}
							class="accent:ring-accent-500 relative block rounded-full ring-2 ring-white transition-transform hover:scale-110 dark:ring-neutral-900"
						>
							<Avatar
								src={profile.avatar}
								alt={profile.handle}
								class={sizeClass === 'sm' ? 'size-12' : sizeClass === 'md' ? 'size-16' : 'size-20'}
							/>
						</a>
						{#if canEdit()}
							<button
								aria-label="Remove friend"
								class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"
								onclick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									removeFriend(profile.did);
								}}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="2.5"
									stroke="currentColor"
									class="size-4"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
								</svg>
							</button>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
