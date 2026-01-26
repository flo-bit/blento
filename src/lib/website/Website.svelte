<script lang="ts">
	import Card from '../cards/Card/Card.svelte';
	import Profile from './Profile.svelte';
	import {
		getDescription,
		getHideProfileSection,
		getProfilePosition,
		getName,
		sortItems
	} from '../helper';
	import { innerWidth } from 'svelte/reactivity/window';
	import { setDidContext, setHandleContext, setIsMobile } from './context';
	import BaseCard from '../cards/BaseCard/BaseCard.svelte';
	import type { WebsiteData } from '$lib/types';
	import Context from './Context.svelte';
	import MadeWithBlento from './MadeWithBlento.svelte';
	import Head from './Head.svelte';
	import type { Did, Handle } from '@atcute/lexicons';
	import QRModalProvider from '$lib/components/qr/QRModalProvider.svelte';
	import EmptyState from './EmptyState.svelte';
	import FloatingEditButton from './FloatingEditButton.svelte';
	import { user } from '$lib/atproto';
	import { env } from '$env/dynamic/public';
	import { page } from '$app/state';

	let { data }: { data: WebsiteData } = $props();

	// Check if floating edit button will be visible (to hide MadeWithBlento)
	const isOwnPage = $derived(user.isLoggedIn && user.profile?.did === data.did);
	const isBlento = $derived(!env.PUBLIC_IS_SELFHOSTED && data.handle === 'blento.app');
	const isEditPage = $derived(page.url.pathname.endsWith('/edit'));
	const showLoginOnEditPage = $derived(isEditPage && !user.isInitializing && !user.isLoggedIn);
	const showFloatingButton = $derived(
		(isOwnPage && !isEditPage) ||
			showLoginOnEditPage ||
			(isBlento && !user.isInitializing && !user.isLoggedIn) ||
			(isBlento && user.isLoggedIn && user.profile?.handle !== data.handle)
	);

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
			<Profile {data} hideBlento={showFloatingButton} />
		{/if}

		<div
			class={[
				'mx-auto max-w-lg',
				!getHideProfileSection(data) && getProfilePosition(data) === 'side'
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

		<MadeWithBlento class="mx-auto block pb-8 text-center @5xl/wrapper:hidden" />
	</div>

	<FloatingEditButton {data} />
</Context>
