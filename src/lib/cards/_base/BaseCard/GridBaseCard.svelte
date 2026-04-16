<script lang="ts">
	import { COLUMNS, margin, mobileMargin } from '$lib';
	import type { Item } from '$lib/types';
	import type { WithElementRef } from 'bits-ui';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import BaseCard from './BaseCard.svelte';

	export type GridBaseCardProps = {
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
	}: GridBaseCardProps = $props();
</script>

<div
	class={['grid-card absolute', isEditing ? 'transition-all' : '']}
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
	<BaseCard {item} {isEditing} {showOutline} {controls} bind:ref class={className}>
		{@render children?.()}
	</BaseCard>
</div>

<style>
	.grid-card {
		container-name: card;
		container-type: size;
		translate: calc((var(--mx) / var(--columns)) * 100cqw + var(--mm))
			calc((var(--my) / var(--columns)) * 100cqw + var(--mm));
		width: calc((var(--mw) / var(--columns)) * 100cqw - (var(--mm) * 2));
		height: calc((var(--mh) / var(--columns)) * 100cqw - (var(--mm) * 2));
	}

	@container grid (width >= 42rem) {
		.grid-card {
			translate: calc((var(--dx) / var(--columns)) * 100cqw + var(--dm))
				calc((var(--dy) / var(--columns)) * 100cqw + var(--dm));
			width: calc((var(--dw) / var(--columns)) * 100cqw - (var(--dm) * 2));
			height: calc((var(--dh) / var(--columns)) * 100cqw - (var(--dm) * 2));
		}
	}
</style>
