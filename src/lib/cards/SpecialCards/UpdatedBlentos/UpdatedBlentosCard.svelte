<script lang="ts">
	import type { ContentComponentProps } from '$lib/cards/types';
	import { getAdditionalUserData } from '$lib/helper';
	import { getProfile } from '$lib/oauth/atproto';
	import type { ProfileViewDetailed } from '@atproto/api/dist/client/types/app/bsky/actor/defs';
	import { onMount } from 'svelte';

	let { item }: ContentComponentProps = $props();

	const recentRecords = getAdditionalUserData().recentRecords;

	let profiles: ProfileViewDetailed[] = $state([]);

	onMount(async () => {
		console.log(recentRecords);
		let uniqueDids = new Set<string>();
		for (let record of recentRecords as { did: string }[]) {
			uniqueDids.add(record.did);
		}
		console.log(uniqueDids, Array.from(uniqueDids));

		for (let did of Array.from(uniqueDids)) {
			console.log(did);
			const profile = await getProfile({ did });
			profiles.push(profile);

			if (profiles.length > 9) return;
		}
	});
</script>

<div class="pointer-events-none">
	<div
		class="from-base-50 dark:from-base-950 absolute inset-0 bg-gradient-to-t to-transparent"
	></div>
	<div class="absolute bottom-3 left-4 text-sm font-semibold">recently updated blentos</div>
</div>
<div class="flex h-full max-w-full items-center gap-4 overflow-x-scroll px-8">
	{#each profiles as profile}
		<a
			href="/{profile.handle}"
			class=" hover:bg-base-200 dark:hover:bg-base-800 mb-4 flex h-fit min-w-24 flex-col items-center justify-center gap-2 rounded-xl p-2"
			target="_blank"
		>
			<div class="line-clamp-2 font-semibold">{profile.displayName || profile.handle}</div>
			<img src={profile.avatar} class="aspect-square size-20 rounded-full" alt="" />
		</a>
	{/each}
</div>
