<script lang="ts">
	import type { ContentComponentProps } from '$lib/cards/types';
	import { getAdditionalUserData } from '$lib/website/context';
	import type { AppBskyActorDefs } from '@atcute/bluesky';
	import { Avatar } from '@foxui/core';

	let { item }: ContentComponentProps = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	const profiles = data[item.cardType] as AppBskyActorDefs.ProfileViewDetailed[];

	function getLink(profile: AppBskyActorDefs.ProfileViewDetailed): string {
		if (profile.handle && profile.handle !== 'handle.invalid') {
			return `/${profile.handle}`;
		} else {
			return `/${profile.did}`;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="px-4 py-2 text-2xl font-bold">Recently updated blentos</div>
	<div class="flex max-w-full grow items-center gap-4 overflow-x-scroll overflow-y-hidden px-4">
		{#each profiles as profile (profile.did)}
			<a
				href={getLink(profile)}
				class="bg-base-100 dark:bg-base-800 hover:bg-base-200 dark:hover:bg-base-700 accent:bg-accent-200/30 accent:hover:bg-accent-200/50 flex h-52 w-44 min-w-44 flex-col items-center justify-center gap-2 rounded-xl p-2 transition-colors duration-150"
				target="_blank"
			>
				<Avatar src={profile.avatar} class="size-28" alt="" />
				<div class="text-md line-clamp-1 max-w-full text-center font-bold">
					{profile.displayName || profile.handle}
				</div>
			</a>
		{/each}
	</div>
</div>
