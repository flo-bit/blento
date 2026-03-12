<script lang="ts">
	import { COLUMNS, margin, mobileMargin } from '$lib';
	import type { Item } from '$lib/types';
	import type { WithElementRef } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { Button } from '@foxui/core';
	import { getColor } from '../..';

	const colors = {
		base: 'bg-base-200/50 dark:bg-base-950/50',
		accent: 'bg-accent-400 dark:bg-accent-500 accent',
		transparent: ''
	} as Record<string, string>;

	export type BaseCardProps = {
		item: Item;
		controls?: Snippet<[]>;
		isEditing?: boolean;
		showOutline?: boolean;
		locked?: boolean;
		fillPage?: boolean;
	} & WithElementRef<HTMLAttributes<HTMLDivElement>>;

	let {
		item,
		children,
		ref = $bindable(null),
		isEditing = false,
		controls,
		showOutline,
		locked = false,
		fillPage = false,
		class: className,
		...rest
	}: BaseCardProps = $props();

	let color = $derived(getColor(item));
</script>

{#snippet pending()}
	<div
		class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
	>
		<p>Loading...</p>
	</div>
{/snippet}

{#snippet failed(_error: unknown, retry: () => void)}
	<div
		class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center gap-1 text-center text-sm"
	>
		<p>Failed to load,</p>
		<Button
			class="border-none bg-transparent p-0"
			onclick={(event) => {
				event.stopPropagation();
				retry();
			}}>try again?</Button
		>
	</div>
{/snippet}

<div
	id={item.id}
	data-flip-id={item.id}
	data-fill-page={fillPage ? 'true' : undefined}
	bind:this={ref}
	draggable={false}
	class={[
		fillPage
			? 'card group/card selection:bg-accent-600/50 focus-within:outline-accent-500 @container/card relative isolate z-0 h-full w-full outline-offset-2 transition-all duration-200 focus-within:outline-2'
			: 'card group/card selection:bg-accent-600/50 focus-within:outline-accent-500 @container/card absolute isolate z-0 rounded-3xl outline-offset-2 transition-all duration-200 focus-within:outline-2',
		!fillPage ? (color ? (colors[color] ?? colors.accent) : colors.base) : '',
		color !== 'accent' && item.color !== 'base' && item.color !== 'transparent' ? color : '',
		showOutline ? 'outline-2' : '',
		className
	]}
	style={`
    --mx: ${item.mobileX};
    --my: ${item.mobileY};
    --mw: ${item.mobileW};
    --mh: ${item.mobileH};
    --mm: ${mobileMargin}px;

    --dx: ${item.x};
    --dy: ${item.y};
    --dw: ${item.w};
    --dh: ${item.h};
    --dm: ${margin}px;

	--columns: ${COLUMNS}`}
	{...rest}
>
	<div
		class={[
			'text-base-900 dark:text-base-50 relative isolate h-full w-full overflow-hidden',
			!fillPage ? 'rounded-3xl' : '',
			color !== 'base' && color != 'transparent' ? 'light' : ''
		]}
	>
		<svelte:boundary {failed} {pending}>
			{#if $effect.pending()}
				pending
			{/if}

			{@render children?.()}
		</svelte:boundary>

		{#if !isEditing && item.cardData.label}
			<div
				class="text-base-900 dark:text-base-50 bg-base-200/50 dark:bg-base-900/50 absolute top-2 left-2 z-30 max-w-[calc(100%-1rem)] rounded-xl p-1 px-2 text-base font-semibold backdrop-blur-md"
			>
				{item.cardData.label}
			</div>
		{/if}
	</div>
	{@render controls?.()}
</div>

<style>
	.card {
		container-name: card;
		container-type: size;
		translate: calc((var(--mx) / var(--columns)) * 100cqw + var(--mm))
			calc((var(--my) / var(--columns)) * 100cqw + var(--mm));
		width: calc((var(--mw) / var(--columns)) * 100cqw - (var(--mm) * 2));
		height: calc((var(--mh) / var(--columns)) * 100cqw - (var(--mm) * 2));
	}

	.card[data-fill-page='true'] {
		translate: none;
		width: 100%;
		height: 100%;
	}

	@container grid (width >= 42rem) {
		.card:not([data-fill-page='true']) {
			translate: calc((var(--dx) / var(--columns)) * 100cqw + var(--dm))
				calc((var(--dy) / var(--columns)) * 100cqw + var(--dm));
			width: calc((var(--dw) / var(--columns)) * 100cqw - (var(--dm) * 2));
			height: calc((var(--dh) / var(--columns)) * 100cqw - (var(--dm) * 2));
		}
	}
</style>
