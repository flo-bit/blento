<script lang="ts">
	import type { Item, SectionRecord } from '$lib/types';
	import { SectionDefinitionsByType } from '$lib/sections';
	import { CardDefinitionsByType } from '$lib/cards';

	let {
		section,
		items = $bindable(),
		canDelete,
		onlayoutchange,
		onclose,
		onselectcard,
		ondelete
	}: {
		section: SectionRecord;
		items: Item[];
		canDelete: boolean;
		onlayoutchange: () => void;
		onclose: () => void;
		onselectcard: (id: string) => void;
		ondelete: () => void;
	} = $props();

	let def = $derived(SectionDefinitionsByType[section.sectionType]);
	let sectionItems = $derived(items.filter((i) => i.sectionId === section.id));

	function rename(value: string) {
		section.name = value;
		onlayoutchange();
	}
</script>

<div class="flex flex-col gap-6 px-4 py-4">
	<!-- Name -->
	<section class="flex flex-col gap-1">
		<label
			for="section-name"
			class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">Name</label
		>
		<input
			id="section-name"
			type="text"
			value={section.name ?? ''}
			oninput={(e) => rename((e.target as HTMLInputElement).value)}
			placeholder={def?.name ?? section.sectionType}
			class="border-base-200 dark:border-base-700 bg-base-50 dark:bg-base-900 text-base-900 dark:text-base-100 placeholder:text-base-400 focus:border-accent-500 w-full rounded-lg border px-3 py-1.5 text-sm outline-none"
		/>
	</section>

	<!-- Section-specific settings -->
	{#if def?.settingsComponent}
		<def.settingsComponent {section} bind:items {onlayoutchange} {onclose} />
	{/if}

	<!-- Cards in this section -->
	<section class="flex flex-col gap-2">
		<h3 class="text-base-500 dark:text-base-400 text-xs font-semibold uppercase">
			Cards ({sectionItems.length})
		</h3>
		{#if sectionItems.length === 0}
			<p class="text-base-400 dark:text-base-500 text-xs">No cards in this section yet.</p>
		{:else}
			<div class="flex flex-col gap-1">
				{#each sectionItems as item (item.id)}
					{@const cardDef = CardDefinitionsByType[item.cardType]}
					<button
						type="button"
						class="border-base-200 dark:border-base-800 bg-base-50 dark:bg-base-900 hover:bg-base-100 dark:hover:bg-base-800 flex w-full cursor-pointer items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition-colors"
						onclick={() => onselectcard(item.id)}
					>
						{#if cardDef?.icon}
							<span class="text-base-400 dark:text-base-500 shrink-0 [&>svg]:size-4"
								>{@html cardDef.icon}</span
							>
						{/if}
						<span class="text-base-700 dark:text-base-300 flex-1 truncate text-sm">
							{item.cardData?.label || cardDef?.name || item.cardType}
						</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="text-base-400 size-3.5 shrink-0"><path d="m9 18 6-6-6-6" /></svg
						>
					</button>
				{/each}
			</div>
		{/if}
	</section>

	<!-- Danger zone -->
	{#if canDelete}
		<section class="border-base-200 dark:border-base-800 border-t pt-4">
			<button
				type="button"
				class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-rose-950/30"
				onclick={ondelete}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="size-4"
				>
					<path d="M3 6h18" />
					<path
						d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
					/>
				</svg>
				Delete section
			</button>
		</section>
	{/if}
</div>
