<script lang="ts">
	import { onMount } from 'svelte';
	import type { SettingsComponentProps } from '../../types';
	import { AtprotoHandlePopup } from '@foxui/social';
	import { Avatar } from '@foxui/core';
	import { getBlentoOrBskyProfile } from '$lib/atproto/methods';
	import type { Did } from '@atcute/lexicons';
	import type { FriendsProfile } from '.';
	import { SettingsSection } from '../../_settings';

	let { item = $bindable() }: SettingsComponentProps = $props();

	let dids = $derived((item.cardData.friends ?? []) as string[]);

	let profiles = $state<Record<string, FriendsProfile | null>>({});

	async function fetchProfile(did: string) {
		if (did in profiles) return;
		try {
			const p = await getBlentoOrBskyProfile({ did: did as Did });
			profiles = { ...profiles, [did]: p ?? null };
		} catch {
			profiles = { ...profiles, [did]: null };
		}
	}

	onMount(() => {
		for (const did of dids) fetchProfile(did);
	});

	function addFriend(actor: { did: string; handle: string }) {
		if (!item.cardData.friends) item.cardData.friends = [];
		if (item.cardData.friends.includes(actor.did)) return;
		item.cardData.friends = [...item.cardData.friends, actor.did];
		fetchProfile(actor.did);
	}

	function removeFriend(did: string) {
		item.cardData.friends = (item.cardData.friends ?? []).filter((d: string) => d !== did);
	}
</script>

<SettingsSection title="Friends">
	{#if dids.length > 0}
		<div class="flex flex-col gap-1">
			{#each dids as did (did)}
				{@const profile = profiles[did]}
				<div
					class="bg-base-200/20 dark:bg-base-800/20 rounded-ui flex items-center gap-2 py-1 pr-1 pl-2"
				>
					<Avatar src={profile?.avatar} alt="" class="size-7 shrink-0" />
					<span class="text-base-700 dark:text-base-200 flex-1 truncate text-sm">
						{profile === undefined ? 'Loading…' : (profile?.handle ?? did)}
					</span>
					<button
						type="button"
						class="text-base-400 dark:text-base-500 shrink-0 cursor-pointer rounded-md p-1 hover:text-rose-500"
						aria-label="Remove friend"
						onclick={() => removeFriend(did)}
					>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							class="size-4"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
						</svg>
					</button>
				</div>
			{/each}
		</div>
	{:else}
		<p class="text-base-500 dark:text-base-400 text-xs">No friends added yet.</p>
	{/if}

	<AtprotoHandlePopup onselected={addFriend} />
</SettingsSection>
