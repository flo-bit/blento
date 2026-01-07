<script lang="ts">
	import { margin, mobileMargin } from '$lib';
	import type { Item } from '$lib/types';
	import type { WithElementRef } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	export type BaseCardProps = {
		item: Item;
		controls?: Snippet<[]>;
		isEditing?: boolean;
	} & WithElementRef<HTMLAttributes<HTMLDivElement>>;

	let {
		item,
		children,
		ref = $bindable(null),
		isEditing = false,
		controls,
		...rest
	}: BaseCardProps = $props();
</script>

<div
	id={item.id}
	data-flip-id={item.id}
	bind:this={ref}
	draggable={isEditing}
	class={[
		'card border-base-200 bg-base-50 group dark:border-base-800 dark:bg-base-900 focus-within:outline-accent-500 absolute z-0 rounded-2xl border outline-offset-2 focus-within:outline-2'
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
    --dm: ${margin}px;`}
	{...rest}
>
	<div class="relative h-full w-full overflow-hidden rounded-[15px]">
		{@render children?.()}
	</div>
	{@render controls?.()}
</div>

<style>
	.card {
		translate: calc((var(--mx) / 4) * 100cqw + var(--mm)) calc((var(--my) / 4) * 100cqw + var(--mm));
		width: calc((var(--mw) / 4) * 100cqw - (var(--mm) * 2));
		height: calc((var(--mh) / 4) * 100cqw - (var(--mm) * 2));
	}

	@container wrapper (width >= 64rem) {
		.card {
			translate: calc((var(--dx) / 4) * 100cqw + var(--dm))
				calc((var(--dy) / 4) * 100cqw + var(--dm));
			width: calc((var(--dw) / 4) * 100cqw - (var(--dm) * 2));
			height: calc((var(--dh) / 4) * 100cqw - (var(--dm) * 2));
		}
	}
</style>
