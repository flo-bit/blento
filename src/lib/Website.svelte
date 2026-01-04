<script lang="ts">
	import Card from './cards/Card/Card.svelte';
	import Profile from './Profile.svelte';
	import { setIsMobile, sortItems } from './helper';
	import type { Item } from './types';
	import { innerWidth } from 'svelte/reactivity/window';

	let { handle, did, items, data }: { handle: string; did: string; items: Item[]; data: any } =
		$props();

	let isMobile = $derived((innerWidth.current ?? 1000) < 1024);

	setIsMobile(() => isMobile);

	let maxHeight = $derived(
		items.reduce(
			(max, item) => Math.max(max, isMobile ? item.mobileY + item.mobileH : item.y + item.h),
			0
		)
	);

	let container: HTMLDivElement | undefined = $state();
</script>

<div class="@container/wrapper relative w-screen">
	<Profile {handle} {did} {data} showEditButton={true} />

	<div class="mx-auto max-w-2xl lg:grid lg:max-w-none lg:grid-cols-4 xl:grid-cols-3">
		<div></div>
		<div
			bind:this={container}
			class="@container/grid relative col-span-3 px-2 py-8 lg:px-8 xl:col-span-2"
		>
			{#each items.toSorted(sortItems) as item}
				<Card {item} />
			{/each}
			<div style="height: {(maxHeight / 4) * 100}cqw;"></div>
		</div>
	</div>
</div>
