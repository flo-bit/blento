<script lang="ts">
	import { getDidContext } from '$lib/website/context';
	import { getImage } from '$lib/helper';
	import type { HeroDecoration } from '.';

	let {
		decoration,
		isEditing = false,
		onclick
	}: {
		decoration: HeroDecoration;
		isEditing?: boolean;
		onclick?: () => void;
	} = $props();

	const did = getDidContext();
	const src = $derived(getImage(decoration as Record<string, any>, did, 'image'));
	const filled = $derived(Boolean(src));

	const sideStyle = $derived(
		decoration.side === 'left'
			? `left: 0; transform: translate(-65%, -50%) rotate(${decoration.rotation ?? 0}deg);`
			: `right: 0; transform: translate(65%, -50%) rotate(${decoration.rotation ?? 0}deg);`
	);
</script>

{#snippet contents()}
	<img {src} alt="" class="aspect-square w-full object-cover" />
	{#if decoration.title || decoration.subtitle}
		<div class="flex flex-col gap-0.5 p-2">
			{#if decoration.title}
				<span class="text-base-950 dark:text-base-50 line-clamp-1 text-sm font-semibold">
					{decoration.title}
				</span>
			{/if}
			{#if decoration.subtitle}
				<span class="text-base-500 dark:text-base-400 line-clamp-1 text-xs">
					{decoration.subtitle}
				</span>
			{/if}
		</div>
	{/if}
{/snippet}

{#if filled && isEditing}
	<button
		type="button"
		class="dark:bg-base-900 bg-base-50 ring-base-900/5 dark:ring-base-50/10 absolute z-0 w-28 cursor-pointer overflow-hidden rounded-2xl text-left shadow-2xl ring-1 transition-transform hover:scale-[1.03] sm:w-44"
		style="top: {(decoration.top ?? 50) + '%'}; {sideStyle}"
		{onclick}
	>
		{@render contents()}
	</button>
{:else if filled}
	<div
		class="dark:bg-base-900 bg-base-50 ring-base-900/5 dark:ring-base-50/10 absolute z-0 w-28 overflow-hidden rounded-2xl shadow-2xl ring-1 sm:w-44"
		style="top: {(decoration.top ?? 50) + '%'}; {sideStyle}"
	>
		{@render contents()}
	</div>
{:else if isEditing}
	<button
		type="button"
		class="border-base-400/60 dark:border-base-500/60 hover:border-accent-500 hover:bg-accent-500/10 text-base-500 dark:text-base-400 hover:text-accent-600 dark:hover:text-accent-400 pointer-events-auto absolute z-0 flex aspect-square w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed bg-white/40 opacity-40 backdrop-blur-sm transition-all duration-150 group-hover/hero:opacity-100 hover:scale-[1.03] hover:opacity-100 sm:w-44 dark:bg-black/20"
		style="top: {(decoration.top ?? 50) + '%'}; {sideStyle}"
		{onclick}
		aria-label="Add decoration"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="size-6"
		>
			<path d="M12 5v14" />
			<path d="M5 12h14" />
		</svg>
		<span class="text-xs font-medium">Add image</span>
	</button>
{/if}
