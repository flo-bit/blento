<script lang="ts">
	import { Tooltip } from 'bits-ui';

	export type ImageGridItem = {
		imageUrl: string | null;
		link: string;
		label: string;
	};

	let {
		items,
		layout = 'grid',
		shape = 'square',
		tooltip = false
	}: {
		items: ImageGridItem[];
		layout?: 'grid' | 'cinema';
		shape?: 'square' | 'circle';
		tooltip?: boolean;
	} = $props();

	let containerWidth = $state(0);
	let containerHeight = $state(0);

	let totalItems = $derived(items.length);

	const GAP = 6;
	const MIN_SIZE = 16;
	const MAX_SIZE = 120;

	function cinemaCapacity(size: number, availW: number, availH: number): number {
		const colsWide = Math.floor((availW + GAP) / (size + GAP));
		if (colsWide < 1) return 0;
		const colsNarrow = Math.max(1, colsWide - 1);
		const maxRows = Math.floor((availH + GAP) / (size + GAP));
		let capacity = 0;
		for (let r = 0; r < maxRows; r++) {
			capacity += r % 2 === 0 ? colsNarrow : colsWide;
		}
		return capacity;
	}

	function gridCapacity(size: number, availW: number, availH: number): number {
		const cols = Math.floor((availW + GAP) / (size + GAP));
		const rows = Math.floor((availH + GAP) / (size + GAP));
		return cols * rows;
	}

	let computedSize = $derived.by(() => {
		if (!containerWidth || !containerHeight || totalItems === 0) return 40;

		let lo = MIN_SIZE;
		let hi = MAX_SIZE;
		const capacityFn = layout === 'cinema' ? cinemaCapacity : gridCapacity;

		while (lo <= hi) {
			const mid = Math.floor((lo + hi) / 2);
			const availW = containerWidth - (layout === 'cinema' ? mid / 2 : 0);
			const availH = containerHeight - (layout === 'cinema' ? mid / 2 : 0);
			if (availW <= 0 || availH <= 0) {
				hi = mid - 1;
				continue;
			}
			if (capacityFn(mid, availW, availH) >= totalItems) {
				lo = mid + 1;
			} else {
				hi = mid - 1;
			}
		}

		return Math.max(MIN_SIZE, hi);
	});

	let padding = $derived(layout === 'cinema' ? computedSize / 4 : 0);

	let rows = $derived.by(() => {
		const availW = containerWidth - (layout === 'cinema' ? computedSize / 4 : 0);
		if (availW <= 0) return [] as ImageGridItem[][];

		const colsWide = Math.floor((availW + GAP) / (computedSize + GAP));
		const colsNarrow = layout === 'cinema' ? Math.max(1, colsWide - 1) : colsWide;

		const rowSizes: number[] = [];
		let remaining = items.length;
		let rowNum = 0;
		while (remaining > 0) {
			const cols = layout === 'cinema' && rowNum % 2 === 0 ? colsNarrow : colsWide;
			rowSizes.push(Math.min(cols, remaining));
			remaining -= cols;
			rowNum++;
		}
		rowSizes.reverse();

		const result: ImageGridItem[][] = [];
		let idx = 0;
		for (const size of rowSizes) {
			result.push(items.slice(idx, idx + size));
			idx += size;
		}
		return result;
	});

	let textSize = $derived(
		computedSize < 24 ? 'text-[10px]' : computedSize < 40 ? 'text-xs' : 'text-sm'
	);

	let shapeClass = $derived(shape === 'circle' ? 'rounded-full' : 'rounded-lg');
</script>

{#snippet gridItem(item: ImageGridItem)}
	{#if item.imageUrl}
		<img
			src={item.imageUrl}
			alt={item.label}
			class="{shapeClass} object-cover"
			style="width: {computedSize}px; height: {computedSize}px;"
		/>
	{:else}
		<div
			class="bg-base-200 dark:bg-base-700 accent:bg-accent-400 flex items-center justify-center {shapeClass}"
			style="width: {computedSize}px; height: {computedSize}px;"
		>
			<span class="text-base-500 dark:text-base-400 accent:text-accent-100 {textSize} font-medium">
				{item.label.charAt(0).toUpperCase()}
			</span>
		</div>
	{/if}
{/snippet}

<div
	class="flex h-full w-full items-center justify-center overflow-hidden px-2"
	bind:clientWidth={containerWidth}
	bind:clientHeight={containerHeight}
>
	{#if totalItems > 0}
		<div style="padding: {padding}px;">
			<div class="flex flex-col items-center" style="gap: {GAP}px;">
				{#each rows as row, rowIdx (rowIdx)}
					<div class="flex justify-center" style="gap: {GAP}px;">
						{#each row as item (item.link)}
							{#if tooltip}
								<Tooltip.Root>
									<Tooltip.Trigger>
										<a
											href={item.link}
											target="_blank"
											rel="noopener noreferrer"
											class="accent:ring-accent-500 block {shapeClass} ring-2 ring-white transition-transform hover:scale-110 dark:ring-neutral-900"
										>
											{@render gridItem(item)}
										</a>
									</Tooltip.Trigger>
									<Tooltip.Portal>
										<Tooltip.Content
											side="top"
											sideOffset={4}
											class="bg-base-900 dark:bg-base-800 text-base-100 z-50 rounded-lg px-3 py-1.5 text-xs font-medium shadow-md"
										>
											{item.label}
										</Tooltip.Content>
									</Tooltip.Portal>
								</Tooltip.Root>
							{:else}
								<a
									href={item.link}
									target="_blank"
									rel="noopener noreferrer"
									class="accent:ring-accent-500 block {shapeClass} ring-2 ring-white transition-transform hover:scale-110 dark:ring-neutral-900"
									title={item.label}
								>
									{@render gridItem(item)}
								</a>
							{/if}
						{/each}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
