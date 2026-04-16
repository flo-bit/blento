<script lang="ts">
	import type { Item } from '$lib/types';
	import type { WithElementRef } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { CardDefinitionsByType, getColor } from '../..';

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
	} & WithElementRef<HTMLAttributes<HTMLDivElement>>;

	let {
		item,
		children,
		ref = $bindable(null),
		isEditing = false,
		controls,
		showOutline,
		class: className,
		...rest
	}: BaseCardProps = $props();

	let color = $derived(getColor(item));
	let noOverflow = $derived(CardDefinitionsByType[item.cardType]?.noOverflow ?? false);
</script>

<div
	id={item.id}
	data-flip-id={item.id}
	bind:this={ref}
	draggable={false}
	class={[
		'card group/card selection:bg-accent-600/50 @container/card relative isolate z-0 h-full w-full rounded-3xl outline-offset-2 transition-[outline] duration-200',
		isEditing ? 'transition-all' : '',
		color ? (colors[color] ?? colors.accent) : colors.base,
		color !== 'accent' && item.color !== 'base' && item.color !== 'transparent' ? color : '',
		showOutline ? 'outline-2' : '',
		className
	]}
	{...rest}
>
	<div
		class={[
			'text-base-900 dark:text-base-50 relative isolate h-full w-full rounded-3xl',
			noOverflow ? 'overflow-visible' : 'overflow-hidden',
			color !== 'base' && color != 'transparent' ? 'light' : ''
		]}
	>
		{@render children?.()}

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
