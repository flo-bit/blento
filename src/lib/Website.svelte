<script lang="ts">
	import Card from './cards/Card/Card.svelte';
	import Profile from './Profile.svelte';
	import { setIsMobile, sortItems } from './helper';
	import type { Item } from './types';
	import { innerWidth } from 'svelte/reactivity/window';
	import { setDidContext, setHandleContext } from './website/context';
	import BaseCard from './cards/BaseCard/BaseCard.svelte';
	import { onMount } from 'svelte';
	import { describeRepo } from './oauth/atproto';

	let { handle, did, items, data }: { handle: string; did: string; items: Item[]; data: any } =
		$props();

	let isMobile = $derived((innerWidth.current ?? 1000) < 1024);

	setIsMobile(() => isMobile);

	// svelte-ignore state_referenced_locally
	setDidContext(did);
	// svelte-ignore state_referenced_locally
	setHandleContext(handle);


	let maxHeight = $derived(
		items.reduce(
			(max, item) => Math.max(max, isMobile ? item.mobileY + item.mobileH : item.y + item.h),
			0
		)
	);

	let container: HTMLDivElement | undefined = $state();

	onMount(() => {
		describeRepo({did});
	});
</script>

<div class="@container/wrapper relative w-full">
	<Profile {handle} {did} {data} showEditButton={true} />

	<div class="mx-auto max-w-2xl lg:grid lg:max-w-none lg:grid-cols-4 xl:grid-cols-3">
		<div></div>
		<div
			bind:this={container}
			class="@container/grid relative col-span-3 px-2 py-8 lg:px-8 xl:col-span-2"
		>
			{#each items.toSorted(sortItems) as item}
				<BaseCard {item}>
					<Card {item} />
				</BaseCard>
			{/each}
			<div style="height: {(maxHeight / 8) * 100}cqw;"></div>
		</div>
	</div>

	<div class="mx-auto block pb-8 text-center text-xs font-light @5xl/wrapper:hidden">
		made with <a
			href="https://blento.app"
			target="_blank"
			class="hover:text-accent-600 dark:hover:text-accent-400 font-medium transition-colors duration-200"
			>blento</a
		>
	</div>
</div>
