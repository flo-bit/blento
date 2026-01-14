<script lang="ts">
	import type { ContentComponentProps } from '$lib/cards/types';
	import { getAdditionalUserData } from '$lib/helper';
	import { getProfile } from '$lib/oauth/atproto';
	import type { ProfileViewDetailed } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
	import { onMount } from 'svelte';

	let { item }: ContentComponentProps = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	const profiles = data[item.cardType] as ProfileViewDetailed[];
</script>

<div class="h-full flex flex-col">
	<div class="text-2xl font-bold px-4 py-2">Recently updated blentos</div>
	<div class="flex grow max-w-full items-center gap-4 overflow-x-scroll overflow-y-hidden px-4">
		{#each profiles as profile}
			<a
				href="/{profile.handle}"
				class="bg-base-100 dark:bg-base-800 hover:bg-base-200 dark:hover:bg-base-700 flex h-52 w-44 min-w-44 flex-col items-center justify-center gap-2 rounded-xl transition-colors duration-150 p-2 accent:bg-accent-200/30 accent:hover:bg-accent-200/50"
				target="_blank"
			>
				<img src={profile.avatar} class="aspect-square size-28 rounded-full" alt="" />
				<div class="line-clamp-1 text-lg font-bold">{profile.displayName || profile.handle}</div>
			</a>
		{/each}
	</div>
</div>
