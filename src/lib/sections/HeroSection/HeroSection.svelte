<script lang="ts">
	import { goto } from '$app/navigation';
	import { user } from '$lib/atproto';
	import { getHandleOrDid } from '$lib/atproto/methods';
	import { atProtoLoginModalState } from '@foxui/social';
	import { Badge, cn } from '@foxui/core';
	import type { SectionContentProps } from '../types';
	import {
		DEFAULT_DECORATION_SLOTS,
		getSlotAssignments,
		getSlotItem,
		heroAlignClasses,
		heroVerticalAlignClasses
	} from '.';
	import Decoration from './Decoration.svelte';

	let { section, items }: SectionContentProps = $props();

	let d = $derived(section.sectionData);
	let align = $derived((d.textAlign as string) ?? 'center');
	let vAlign = $derived((d.verticalAlign as string) ?? 'center');
	let assignments = $derived(getSlotAssignments(d));
	let sectionItems = $derived(items.filter((i) => i.sectionId === section.id));

	const buttonClass =
		'text-base-950 dark:text-base-50 accent:text-base-950 mt-2 inline-flex cursor-pointer items-center justify-center rounded-2xl bg-accent-400 dark:bg-accent-500 px-6 py-3 text-xl font-semibold transition-colors duration-100 hover:bg-accent-400';
</script>

<div
	class="@container/grid relative col-span-3 flex min-h-[calc(100dvh-4rem)] flex-col overflow-visible px-2 py-10 lg:px-8"
>
	<div class="relative flex flex-1 flex-col">
		{#each DEFAULT_DECORATION_SLOTS as slot (slot.id)}
			<Decoration {slot} item={getSlotItem(slot, assignments, sectionItems)} />
		{/each}

		<div
			class={cn(
				'pointer-events-none relative z-10 flex w-full flex-1 flex-col gap-4 px-8 py-10 sm:px-12',
				heroAlignClasses[align],
				heroVerticalAlignClasses[vAlign]
			)}
		>
			{#if d.showBadge !== false && d.badge}
				<Badge size="md" variant="primary">
					{d.badge}
				</Badge>
			{/if}

			<h1
				class="text-base-950 dark:text-base-50 accent:text-accent-950 text-4xl font-bold tracking-tight text-balance sm:text-5xl md:text-6xl"
			>
				{d.title || 'My cool website'}
			</h1>

			{#if d.showSubtitle !== false && d.subtitle}
				<p
					class="text-base-600 dark:text-base-300 accent:text-accent-900/80 max-w-2xl text-lg text-pretty sm:text-xl"
				>
					{d.subtitle}
				</p>
			{/if}

			{#if d.showButton !== false && d.buttonText}
				{#if d.buttonHref === '#login'}
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
						{d.buttonText}
					</button>
				{:else}
					<a
						href={d.buttonHref || '#'}
						target={d.buttonHref ? '_blank' : undefined}
						rel="noopener noreferrer"
						class={cn(buttonClass, 'pointer-events-auto')}
					>
						{d.buttonText}
					</a>
				{/if}
			{/if}
		</div>
	</div>
</div>
