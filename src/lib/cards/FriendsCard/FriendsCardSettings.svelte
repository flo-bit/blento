<script lang="ts">
	import { onMount } from 'svelte';
	import type { Item } from '$lib/types';
	import type { SettingsComponentProps } from '../types';
	import type { AppBskyActorDefs } from '@atcute/bluesky';
	import type { Did } from '@atcute/lexicons';
	import type { FriendsProfile } from '.';
	import { getBlentoOrBskyProfile } from '$lib/atproto/methods';
	import HandleInput from '$lib/atproto/UI/HandleInput.svelte';
	import { Avatar, Button } from '@foxui/core';

	let { item = $bindable<Item>() }: SettingsComponentProps = $props();

	let handleValue = $state('');
	let inputRef: HTMLInputElement | null = $state(null);
	let profiles: FriendsProfile[] = $state([]);

	let dids: string[] = $derived(item.cardData.friends ?? []);

	onMount(() => {
		loadProfiles();
	});

	async function loadProfiles() {
		const results = await Promise.all(
			dids.map((did) => getBlentoOrBskyProfile({ did: did as Did }).catch(() => undefined))
		);
		profiles = results.filter(
			(p): p is FriendsProfile => !!p && p.handle !== 'handle.invalid'
		);
	}

	function addFriend(actor: AppBskyActorDefs.ProfileViewBasic) {
		if (!item.cardData.friends) item.cardData.friends = [];
		if (item.cardData.friends.includes(actor.did)) return;
		item.cardData.friends = [...item.cardData.friends, actor.did];
		profiles = [
			...profiles,
			{
				did: actor.did,
				handle: actor.handle,
				displayName: actor.displayName || actor.handle,
				avatar: actor.avatar,
				hasBlento: false
			} as FriendsProfile
		];
		requestAnimationFrame(() => {
			handleValue = '';
			if (inputRef) inputRef.value = '';
		});
	}

	function removeFriend(did: string) {
		item.cardData.friends = item.cardData.friends.filter((d: string) => d !== did);
		profiles = profiles.filter((p) => p.did !== did);
	}

	function getProfile(did: string): FriendsProfile | undefined {
		return profiles.find((p) => p.did === did);
	}
</script>

<div class="flex flex-col gap-3">
	<HandleInput bind:value={handleValue} onselected={addFriend} bind:ref={inputRef} />

	{#if dids.length > 0}
		<div class="flex flex-col gap-1.5">
			{#each dids as did (did)}
				{@const profile = getProfile(did)}
				<div class="flex items-center gap-2">
					<Avatar
						src={profile?.avatar}
						alt={profile?.handle ?? did}
						class="size-6 rounded-full"
					/>
					<span class="min-w-0 flex-1 truncate text-sm">
						{profile?.handle ?? did}
					</span>
					<Button
						variant="ghost"
						size="icon"
						class="size-6 min-w-6"
						onclick={() => removeFriend(did)}
					>
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
								d="M6 18 18 6M6 6l12 12"
							/>
						</svg>
					</Button>
				</div>
			{/each}
		</div>
	{/if}
</div>
