<script lang="ts">
	import type { Item } from '$lib/types';
	import type { WithElementRef } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { CardDefinitionsByType, getColor } from '../..';
	import { themeState } from '$lib/themes/state.svelte';
	import { THEMES } from '$lib/themes/themes';

	const colors = {
		base: 'bg-base-200/50 dark:bg-base-950/50',
		accent: 'bg-accent-400 dark:bg-accent-500',
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
	let variantId = $derived<'base' | 'accent' | 'transparent' | 'colored'>(
		!color || color === 'base'
			? 'base'
			: color === 'accent'
				? 'accent'
				: color === 'transparent'
					? 'transparent'
					: 'colored'
	);
	let variantClass = $derived(`variant-${variantId}`);

	let activeTheme = $derived(THEMES.find((t) => t.id === themeState.id));
	// Per-variant wrapper class for the inner content div. Default behavior:
	// accent/colored cards have a saturated bg, so `.light` suppresses dark
	// utilities (keep text dark). Themes can override (e.g. Terminal's
	// border-only treatment doesn't fill the card, so `.light` shouldn't apply).
	let wrapperClass = $derived.by(() => {
		const themeOverride = activeTheme?.cardVariants?.[variantId]?.wrapperClass;
		if (themeOverride !== undefined) return themeOverride;
		return variantId === 'accent' || variantId === 'colored' ? 'light' : '';
	});
	// Per-variant extra class on the outer card. Default `.accent` for
	// accent/colored fires card-internal `accent:` utilities (designed for
	// saturated accent bg). Themes whose accent variant isn't a solid fill
	// should override to `''`.
	let outerClass = $derived.by(() => {
		const themeOverride = activeTheme?.cardVariants?.[variantId]?.outerClass;
		if (themeOverride !== undefined) return themeOverride;
		return variantId === 'accent' || variantId === 'colored' ? 'accent' : '';
	});
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
		outerClass,
		'themed-card',
		variantClass,
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
			wrapperClass
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
