<script lang="ts">
	import Profile from './Profile.svelte';
	import {
		getDescription,
		getHideProfileSection,
		getProfilePosition,
		getName,
		getImage
	} from '../helper';
	import { innerWidth } from 'svelte/reactivity/window';
	import { setDidContext, setHandleContext, setIsMobile } from './context';
	import type { WebsiteData } from '$lib/types';
	import Context from './Context.svelte';
	import { SectionDefinitionsByType } from '$lib/sections';
	import MadeWithBlento from './MadeWithBlento.svelte';
	import Head from './Head.svelte';
	import type { Did, Handle } from '@atcute/lexicons';
	import QRModalProvider from '$lib/components/qr/QRModalProvider.svelte';
	import ImageViewerProvider from '$lib/components/image-viewer/ImageViewerProvider.svelte';
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
	const showLoginOnEditPage = $derived(isEditPage && !user.isLoggedIn);
	const showFloatingButton = $derived(
		(isOwnPage && !isEditPage) ||
			showLoginOnEditPage ||
			(isBlento && !user.isLoggedIn) ||
			(isBlento && user.isLoggedIn && user.profile?.handle !== data.handle)
	);

	let isMobile = $derived((innerWidth.current ?? 1000) < 1024);
	setIsMobile(() => isMobile);

	// svelte-ignore state_referenced_locally
	setDidContext(data.did as Did);
	// svelte-ignore state_referenced_locally
	setHandleContext(data.handle as Handle);

	const ogImageUrl = $derived.by(() => {
		const origin = page.url.origin;
		if (page.data.customDomain) return `${origin}/og-new.png`;
		const handle = data.profile?.handle;
		const actor = handle && handle !== 'handle.invalid' ? handle : data.did;
		return `${origin}/${actor}/og-new.png`;
	});

	let container: HTMLDivElement | undefined = $state();
</script>

<Head
	favicon={getImage(data.publication, data.did, 'icon') || data.profile.avatar}
	title={getName(data)}
	image={ogImageUrl}
	description={getDescription(data)}
	accentColor={data.publication?.preferences?.accentColor}
	baseColor={data.publication?.preferences?.baseColor}
/>

<Context {data}>
	<QRModalProvider />
	<ImageViewerProvider />
	<div class="@container/wrapper relative w-full overflow-x-hidden">
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
			<div class="@5xl/wrapper:col-start-2 @5xl/wrapper:-col-end-1">
				{#if data.cards.length === 0 && data.page === 'blento.self'}
					<div bind:this={container} class="@container/grid relative px-2 py-8 lg:px-8">
						<EmptyState {data} />
					</div>
				{:else}
					{#each data.sections.toSorted((a, b) => a.index - b.index) as section (section.id)}
						{@const def = SectionDefinitionsByType[section.sectionType]}
						{#if def}
							<def.contentComponent
								{section}
								items={data.cards.filter((c) => c.sectionId === section.id)}
								{isMobile}
							/>
						{/if}
					{/each}
				{/if}
			</div>
		</div>

		<MadeWithBlento class="mx-auto block pb-8 text-center @5xl/wrapper:hidden" />
	</div>

	<FloatingEditButton {data} />
</Context>
