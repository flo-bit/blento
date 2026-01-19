<script lang="ts">
	import { COLUMNS, margin, mobileMargin } from '$lib';
	import type { Item } from '$lib/types';
	import type { WithElementRef } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { getColor } from '..';

	const colors = {
		base: 'bg-base-200/50 dark:bg-base-950/50',
		accent:
			'bg-accent-400 dark:bg-accent-500 accent',
		transparent: ''
	} as Record<string, string>;

	export type BaseCardProps = {
		item: Item;
		controls?: Snippet<[]>;
		isEditing?: boolean;
		showOutline?: boolean
		withoutShadow?: boolean,
	} & WithElementRef<HTMLAttributes<HTMLDivElement>>;

	let {
		item,
		children,
		ref = $bindable(null),
		isEditing = false,
		controls,
		showOutline,
		class: className,
		withoutShadow = false,
		...rest
	}: BaseCardProps = $props();

	let color = $derived(getColor(item));
</script>

<div
	id={item.id}
	data-flip-id={item.id}
	bind:this={ref}
	draggable={isEditing}
	class={[
		'card group selection:bg-accent-600/50 focus-within:outline-accent-500 @container/card absolute z-0 rounded-3xl outline-offset-2 transition-all duration-200 focus-within:outline-2 isolate',
		color ? (colors[color] ?? colors.accent) : colors.base,
		{
			// Outline
			'outline-2': showOutline,

			// "Glowing" effect
			'before:absolute before:inset-0 before:rounded-[inherit]': !withoutShadow,
			'before:border before:border-black/10 before:content-[\'\']': !withoutShadow,
			'after:absolute after:inset-[1px]': !withoutShadow,
			'after:rounded-[calc(theme(borderRadius.3xl)-1px)]': !withoutShadow,
			'after:border after:border-white/20': !withoutShadow,
			'after:[mask-image:linear-gradient(to_bottom,black,transparent)]': !withoutShadow,
			'after:content-[\'\']': !withoutShadow,

			// Shadow
			'shadow-[0_2px_4px_rgba(0,0,0,0.04)]': !withoutShadow,

			[color]: color !== 'accent' && item.color !== 'base' && item.color !== 'transparent'
		},
		className,
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
	<div class={["relative h-full w-full overflow-hidden rounded-[23px] isolate text-base-900 dark:text-base-50",
		color !== 'base' && color != 'transparent' ? 'light' : ''
	]}>
		{@render children?.()}
	</div>
	{@render controls?.()}
</div>

<style>
	.card {
		translate: calc((var(--mx) / var(--columns)) * 100cqw + var(--mm))
			calc((var(--my) / var(--columns)) * 100cqw + var(--mm));
		width: calc((var(--mw) / var(--columns)) * 100cqw - (var(--mm) * 2));
		height: calc((var(--mh) / var(--columns)) * 100cqw - (var(--mm) * 2));
	}

	@container grid (width >= 42rem) {
		.card {
			translate: calc((var(--dx) / var(--columns)) * 100cqw + var(--dm))
				calc((var(--dy) / var(--columns)) * 100cqw + var(--dm));
			width: calc((var(--dw) / var(--columns)) * 100cqw - (var(--dm) * 2));
			height: calc((var(--dh) / var(--columns)) * 100cqw - (var(--dm) * 2));
		}
	}
</style>
