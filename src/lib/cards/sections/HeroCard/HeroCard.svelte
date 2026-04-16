<script lang="ts">
	import { goto } from '$app/navigation';
	import { user } from '$lib/atproto';
	import { getHandleOrDid } from '$lib/atproto/methods';
	import { atProtoLoginModalState } from '@foxui/social';
	import { Badge, cn } from '@foxui/core';
	import type { ContentComponentProps } from '../../types';
	import { getHeroDecorations, heroAlignClasses, heroVerticalAlignClasses } from '.';
	import Decoration from './Decoration.svelte';

	let { item }: ContentComponentProps = $props();

	let align = $derived((item.cardData.textAlign as string) ?? 'center');
	let vAlign = $derived((item.cardData.verticalAlign as string) ?? 'center');
	let decorations = $derived(getHeroDecorations(item.cardData));

	const buttonClass =
		'text-base-950 dark:text-base-50 accent:text-base-950 mt-2 inline-flex cursor-pointer items-center justify-center rounded-2xl bg-accent-400 dark:bg-accent-500 px-6 py-3 text-xl font-semibold transition-colors duration-100 hover:bg-accent-400';
</script>

<div class="relative h-full w-full">
	{#each decorations as decoration (decoration.id)}
		<Decoration {decoration} />
	{/each}

	<div
		class={cn(
			'pointer-events-none relative z-10 flex h-full w-full flex-col gap-4 px-8 py-10 sm:px-12',
			heroAlignClasses[align],
			heroVerticalAlignClasses[vAlign]
		)}
	>
		{#if item.cardData.showBadge !== false && item.cardData.badge}
			<Badge size="md" variant="primary">
				{item.cardData.badge}
			</Badge>
		{/if}

		<h1
			class="text-base-950 dark:text-base-50 accent:text-accent-950 text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl"
		>
			{item.cardData.title || 'My cool website'}
		</h1>

		{#if item.cardData.showSubtitle !== false && item.cardData.subtitle}
			<p
				class="text-base-600 dark:text-base-300 accent:text-accent-900/80 max-w-2xl text-lg text-pretty sm:text-xl"
			>
				{item.cardData.subtitle}
			</p>
		{/if}

		{#if item.cardData.showButton !== false && item.cardData.buttonText}
			{#if item.cardData.buttonHref === '#login'}
				<button
					type="button"
					onclick={() => {
						if (user.isLoggedIn && user.profile) {
							goto('/' + getHandleOrDid(user.profile) + '/edit', {});
						} else {
							atProtoLoginModalState.show();
						}
					}}
					class={cn(buttonClass, 'pointer-events-auto')}
				>
					{item.cardData.buttonText}
				</button>
			{:else}
				<a
					href={item.cardData.buttonHref || '#'}
					target={item.cardData.buttonHref ? '_blank' : undefined}
					rel="noopener noreferrer"
					class={cn(buttonClass, 'pointer-events-auto')}
				>
					{item.cardData.buttonText}
				</a>
			{/if}
		{/if}
	</div>
</div>
