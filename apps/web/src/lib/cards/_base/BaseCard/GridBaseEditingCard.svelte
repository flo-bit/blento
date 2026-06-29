<script lang="ts">
	import { COLUMNS, margin, mobileMargin } from '$lib';
	import type { Item } from '$lib/types';
	import type { WithElementRef } from 'bits-ui';
	import type { HTMLAttributes } from 'svelte/elements';
	import BaseEditingCard from './BaseEditingCard.svelte';

	export type GridBaseEditingCardProps = {
		item: Item;
		ondelete: () => void;
		onsetsize: (newW: number, newH: number) => void;
	} & WithElementRef<HTMLAttributes<HTMLDivElement>>;

	let {
		item = $bindable(),
		children,
		ref = $bindable(null),
		onsetsize,
		ondelete,
		...rest
	}: GridBaseEditingCardProps = $props();
</script>

<div
	class="grid-card absolute transition-all"
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
>
	<BaseEditingCard bind:item bind:ref {ondelete} {onsetsize} {...rest}>
		{@render children?.()}
	</BaseEditingCard>
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
