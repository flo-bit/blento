<script lang="ts">
	import type { ContentComponentProps } from '$lib/cards/types';
	import { getAdditionalUserData } from '$lib/website/context';
	import type { ProfileViewDetailed } from '@atproto/api/dist/client/types/app/bsky/actor/defs';

	let { item }: ContentComponentProps = $props();

	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	const profiles = data[item.cardType] as ProfileViewDetailed[];

	$inspect(profiles);
</script>

<div class="flex h-full flex-col">
	<div class="px-4 py-2 text-2xl font-bold">Recently updated blentos</div>
	<div class="flex max-w-full grow items-center gap-4 overflow-x-scroll overflow-y-hidden px-4">
		{#each profiles as profile}
			<a
				href="/{profile.handle}"
				class="bg-base-100 dark:bg-base-800 hover:bg-base-200 dark:hover:bg-base-700 accent:bg-accent-200/30 accent:hover:bg-accent-200/50 flex h-52 w-44 min-w-44 flex-col items-center justify-center gap-2 rounded-xl p-2 transition-colors duration-150"
				target="_blank"
			>
				<img
					src={profile.avatar}
					class="bg-base-200 dark:bg-base-700 accent:bg-accent-300 aspect-square size-28 rounded-full"
					alt=""
					loading="lazy"
				/>
				<div class="text-md line-clamp-1 text-center font-bold max-w-full">
					{profile.displayName || profile.handle}
				</div>
			</a>
		{/each}
	</div>
</div>


https://coverartarchive.org/release/46656572-9172-44cc-9efa-7ee9b87fe489/front-250
https://coverartarchive.org/release/d8e8f57d-40b6-45e3-8c01-8816d33995d1/front-250

42bed944-e781-4447-82df-8cae4918dd94

d8e8f57d-40b6-45e3-8c01-8816d33995d1