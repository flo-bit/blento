<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { innerWidth } from 'svelte/reactivity/window';
	import BaseCard from '$lib/cards/_base/BaseCard/BaseCard.svelte';
	import Card from '$lib/cards/_base/Card/Card.svelte';
	import { CardDefinitionsByType, getColor } from '$lib/cards';
	import { getDescription, getImage, getName } from '$lib/helper';
	import QRModalProvider from '$lib/components/qr/QRModalProvider.svelte';
	import ImageViewerProvider from '$lib/components/image-viewer/ImageViewerProvider.svelte';
	import type { WebsiteData } from '$lib/types';
	import Context from './Context.svelte';
	import Head from './Head.svelte';
	import { setIsMobile } from './context';

	let { data }: { data: WebsiteData } = $props();

	let item = $derived(data.cards[0]);
	let embeddedItem = $derived({
		...item,
		x: 0,
		y: 0,
		mobileX: 0,
		mobileY: 0
	});

	let isMobile = $derived((innerWidth.current ?? 1000) < 1024);
	setIsMobile(() => isMobile);

	const colors = {
		base: 'bg-base-200/50 dark:bg-base-950/50',
		accent: 'bg-accent-400 dark:bg-accent-500 accent',
		transparent: 'bg-transparent'
	} as Record<string, string>;

	let color = $derived(getColor(item));
	let backgroundClass = $derived(color ? (colors[color] ?? colors.accent) : colors.base);
	let pageColorClass = $derived(
		color !== 'accent' && item?.color !== 'base' && item?.color !== 'transparent' ? color : ''
	);
	let cardWidth = $derived(Math.max(isMobile ? item.mobileW : item.w, 1));
	let cardHeight = $derived(Math.max(isMobile ? item.mobileH : item.h, 1));

	let title = $derived.by(() => {
		const label = item?.cardData?.label as string | undefined;
		const cardName = CardDefinitionsByType[item?.cardType ?? '']?.name;

		return label
			? `${label} • ${getName(data)}`
			: cardName
				? `${cardName} • ${getName(data)}`
				: getName(data);
	});

	let description = $derived(
		(item?.cardData?.title as string | undefined) ||
			(item?.cardData?.text as string | undefined) ||
			getDescription(data)
	);

	const safeJson = (value: string) => JSON.stringify(value).replace(/</g, '\\u003c');

	let themeMode = $derived.by(() => {
		const theme = page.url.searchParams.get('theme');
		return theme === 'dark' || theme === 'light' || theme === 'auto' ? theme : undefined;
	});

	let themeScript = $derived.by(() => {
		if (!themeMode) return '';

		return (
			`<script>(function(){var theme=${safeJson(themeMode)};var el=document.documentElement;` +
			`var apply=function(mode){el.classList.remove('dark','light');` +
			`el.classList.add(mode==='auto'&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':mode==='auto'?'light':mode);};` +
			`apply(theme);})();<` +
			'/script>'
		);
	});

	$effect(() => {
		if (!browser || !themeMode) return;

		const root = document.documentElement;
		const previousHadDark = root.classList.contains('dark');
		const previousHadLight = root.classList.contains('light');

		const applyTheme = () => {
			root.classList.remove('dark', 'light');

			if (themeMode === 'auto') {
				root.classList.add(
					window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
				);
				return;
			}

			root.classList.add(themeMode);
		};

		applyTheme();

		if (themeMode !== 'auto') {
			return () => {
				root.classList.remove('dark', 'light');
				if (previousHadDark) root.classList.add('dark');
				if (previousHadLight) root.classList.add('light');
			};
		}

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', applyTheme);

		return () => {
			mediaQuery.removeEventListener('change', applyTheme);
			root.classList.remove('dark', 'light');
			if (previousHadDark) root.classList.add('dark');
			if (previousHadLight) root.classList.add('light');
		};
	});
</script>

<Head
	favicon={getImage(data.publication, data.did, 'icon') || data.profile.avatar}
	{title}
	{description}
	accentColor={data.publication?.preferences?.accentColor}
	baseColor={data.publication?.preferences?.baseColor}
/>

<svelte:head>
	<meta name="robots" content="noindex" />
	{@html themeScript}
</svelte:head>

<Context {data}>
	<QRModalProvider />
	<ImageViewerProvider />

	<div class={[backgroundClass, pageColorClass, 'embed-page w-full']}>
		<div class="embed-stage @container/grid">
			<div
				class="embed-content"
				style={`--embed-ratio: ${cardWidth / cardHeight}; aspect-ratio: ${cardWidth} / ${cardHeight};`}
			>
				<BaseCard item={embeddedItem} fillPage>
					<Card item={embeddedItem} />
				</BaseCard>
			</div>
		</div>
	</div>
</Context>

<style>
	:global(html),
	:global(body) {
		min-height: 100%;
	}

	.embed-page {
		min-height: 100vh;
	}

	.embed-stage {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: clamp(12px, 3vw, 32px);
		container-type: inline-size;
	}

	.embed-content {
		width: min(100%, calc((100vh - clamp(24px, 6vw, 64px)) * var(--embed-ratio)));
		max-width: calc(100vw - clamp(24px, 6vw, 64px));
		max-height: calc(100vh - clamp(24px, 6vw, 64px));
	}
</style>
