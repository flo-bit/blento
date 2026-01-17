<script lang="ts">
	import Card from '../cards/Card/Card.svelte';
	import Profile from './Profile.svelte';
	import { getDescription, getHideProfile, getName, sortItems } from '../helper';
	import { innerWidth } from 'svelte/reactivity/window';
	import { setDidContext, setHandleContext, setIsMobile } from './context';
	import BaseCard from '../cards/BaseCard/BaseCard.svelte';
	import type { WebsiteData } from '$lib/types';
	import Context from './Context.svelte';
	import Head from './Head.svelte';

	let { data }: { data: WebsiteData } = $props();

	let isMobile = $derived((innerWidth.current ?? 1000) < 1024);
	setIsMobile(() => isMobile);

	// svelte-ignore state_referenced_locally
	setDidContext(data.did);
	// svelte-ignore state_referenced_locally
	setHandleContext(data.handle);

	let maxHeight = $derived(
		data.cards.reduce(
			(max, item) => Math.max(max, isMobile ? item.mobileY + item.mobileH : item.y + item.h),
			0
		)
	);

	let container: HTMLDivElement | undefined = $state();
</script>

<Head
	favicon={data.profile.avatar ?? null}
	title={getName(data)}
	image={'/' + data.handle + '/og.png'}
	description={getDescription(data)}
/>

<Context {data}>
	<div class="@container/wrapper relative w-full">
		{#if !getHideProfile(data)}
			<Profile {data} showEditButton={true} />
		{/if}

		<div
			class={[
				'mx-auto max-w-lg',
				!getHideProfile(data)
					? '@5xl/wrapper:grid @5xl/wrapper:max-w-7xl @5xl/wrapper:grid-cols-4'
					: '@5xl/wrapper:max-w-4xl'
			]}
		>
			<div></div>
			<div bind:this={container} class="@container/grid relative col-span-3 px-2 py-8 lg:px-8">
				{#each data.cards.toSorted(sortItems) as item}
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
</Context>
