<script lang="ts">
	import Card from '../cards/Card/Card.svelte';
	import Profile from './Profile.svelte';
	import { getDescription, getHideProfileSection, getName, sortItems } from '../helper';
	import { innerWidth } from 'svelte/reactivity/window';
	import { setDidContext, setHandleContext, setIsMobile } from './context';
	import BaseCard from '../cards/BaseCard/BaseCard.svelte';
	import type { WebsiteData } from '$lib/types';
	import Context from './Context.svelte';
	import Head from './Head.svelte';
	import type { Did, Handle } from '@atcute/lexicons';
	import QRModalProvider from '$lib/components/qr/QRModalProvider.svelte';
	import EmptyState from './EmptyState.svelte';

	let { data }: { data: WebsiteData } = $props();

	let isMobile = $derived((innerWidth.current ?? 1000) < 1024);
	setIsMobile(() => isMobile);

	// svelte-ignore state_referenced_locally
	setDidContext(data.did as Did);
	// svelte-ignore state_referenced_locally
	setHandleContext(data.handle as Handle);

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
	<QRModalProvider />
	<div class="@container/wrapper relative w-full">
		{#if !getHideProfileSection(data)}
			<Profile {data} showEditButton={true} />
		{/if}

		<div
			class={[
				'mx-auto max-w-lg',
				!getHideProfileSection(data)
					? '@5xl/wrapper:grid @5xl/wrapper:max-w-7xl @5xl/wrapper:grid-cols-4'
					: '@5xl/wrapper:max-w-4xl'
			]}
		>
			<div></div>
			<div bind:this={container} class="@container/grid relative col-span-3 px-2 py-8 lg:px-8">
				{#if data.cards.length === 0}
					<EmptyState {data} />
				{:else}
					{#each data.cards.toSorted(sortItems) as item (item.id)}
						<BaseCard {item}>
							<Card {item} />
						</BaseCard>
					{/each}
					<div style="height: {(maxHeight / 8) * 100}cqw;"></div>
				{/if}
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
