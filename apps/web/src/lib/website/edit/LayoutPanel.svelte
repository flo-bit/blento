<script lang="ts">
	import { Button, Popover } from '@foxui/core';
	import type { Item, SectionRecord, WebsiteData } from '$lib/types';
	import { AllSectionDefinitions, SectionDefinitionsByType } from '$lib/sections';
	import { getHideProfileSection, getProfilePosition } from '$lib/helpers/website';

	let {
		sections,
		data = $bindable(),
		items,
		selectedSectionId,
		onselectsection,
		onaddsection,
		onmovesection
	}: {
		sections: SectionRecord[];
		data: WebsiteData;
		items: Item[];
		selectedSectionId: string | null;
		onselectsection: (id: string) => void;
		onaddsection: (type: string) => void;
		onmovesection: (id: string, dir: -1 | 1) => void;
	} = $props();

	let hideProfile = $derived(getHideProfileSection(data));
	let profilePosition = $derived(getProfilePosition(data));

	const sortedSections = $derived(sections.toSorted((a, b) => a.index - b.index));

	function cardCount(sectionId: string) {
		return items.filter((i) => i.sectionId === sectionId).length;
	}

	function toggleProfile() {
		data.publication.preferences ??= {};
		data.publication.preferences.hideProfileSection = !hideProfile;
		data = { ...data };
	}

	function setProfilePosition(pos: 'side' | 'top') {
		data.publication.preferences ??= {};
		data.publication.preferences.profilePosition = pos;
		data = { ...data };
	}

	let addOpen = $state(false);

	const presetBtn =
		'flex h-9 flex-1 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-colors';
	const presetOn = 'border-accent-500 bg-accent-500/10 text-accent-600 dark:text-accent-400';
	const presetOff =
		'border-base-200 dark:border-base-700 text-base-600 dark:text-base-400 hover:bg-base-100 dark:hover:bg-base-800';
	const arrowBtn =
		'text-base-400 hover:text-base-700 dark:hover:text-base-200 cursor-pointer rounded p-0.5 disabled:cursor-default disabled:opacity-30';
</script>

<div class="flex flex-col gap-3 px-4 py-4">
	<!-- Profile -->
	<div
		class="bg-base-50 dark:bg-base-900 border-base-200 dark:border-base-800 flex flex-col gap-2 rounded-xl border p-2"
	>
		<div class="flex items-center gap-2">
			<span class="text-base-400 dark:text-base-500 shrink-0 [&>svg]:size-4">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
					<circle cx="12" cy="7" r="4" />
				</svg>
			</span>
			<span class="text-base-700 dark:text-base-300 flex-1 text-sm font-medium">Profile</span>
			<button
				type="button"
				class="cursor-pointer rounded-md p-1 transition-colors {hideProfile
					? 'text-base-400 dark:text-base-600 hover:bg-base-200 dark:hover:bg-base-800'
					: 'text-accent-600 dark:text-accent-400 hover:bg-accent-500/10'}"
				aria-label={hideProfile ? 'Show profile' : 'Hide profile'}
				onclick={toggleProfile}
			>
				{#if hideProfile}
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
						<path
							d="M9.88 9.88a3 3 0 1 0 4.24 4.24M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"
						/>
						<line x1="2" x2="22" y1="2" y2="22" />
					</svg>
				{:else}
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
						<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
						<circle cx="12" cy="12" r="3" />
					</svg>
				{/if}
			</button>
		</div>
		{#if !hideProfile}
			<div class="flex gap-1">
				<button
					type="button"
					class={[presetBtn, profilePosition === 'side' ? presetOn : presetOff]}
					aria-pressed={profilePosition === 'side'}
					onclick={() => setProfilePosition('side')}
				>
					Side
				</button>
				<button
					type="button"
					class={[presetBtn, profilePosition === 'top' ? presetOn : presetOff]}
					aria-pressed={profilePosition === 'top'}
					onclick={() => setProfilePosition('top')}
				>
					Top
				</button>
			</div>
		{/if}
	</div>

	<!-- Sections -->
	<span class="text-base-500 dark:text-base-400 px-1 text-xs font-semibold uppercase">Sections</span
	>
	{#each sortedSections as section, i (section.id)}
		{@const def = SectionDefinitionsByType[section.sectionType]}
		<div
			class={[
				'flex items-center gap-1 rounded-xl border p-2 transition-colors',
				selectedSectionId === section.id
					? 'border-accent-500 bg-accent-50 dark:bg-accent-950/30'
					: 'border-base-200 dark:border-base-800 bg-base-50 dark:bg-base-900'
			]}
		>
			<button
				type="button"
				class="flex flex-1 cursor-pointer items-center gap-2 overflow-hidden text-left"
				onclick={() => onselectsection(section.id)}
			>
				{#if def?.icon}
					<span class="text-base-400 dark:text-base-500 shrink-0 [&>svg]:size-4"
						>{@html def.icon}</span
					>
				{/if}
				<span class="flex flex-1 flex-col overflow-hidden">
					<span
						class="truncate text-sm font-medium {selectedSectionId === section.id
							? 'text-accent-700 dark:text-accent-300'
							: 'text-base-700 dark:text-base-300'}"
					>
						{section.name || def?.name || section.sectionType}
					</span>
					<span class="text-base-400 dark:text-base-500 text-xs">
						{cardCount(section.id)}
						{cardCount(section.id) === 1 ? 'card' : 'cards'}
					</span>
				</span>
			</button>
			<div class="flex shrink-0 flex-col">
				<button
					type="button"
					class={arrowBtn}
					aria-label="Move section up"
					disabled={i === 0}
					onclick={() => onmovesection(section.id, -1)}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="size-3"><path d="m18 15-6-6-6 6" /></svg
					>
				</button>
				<button
					type="button"
					class={arrowBtn}
					aria-label="Move section down"
					disabled={i === sortedSections.length - 1}
					onclick={() => onmovesection(section.id, 1)}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="size-3"><path d="m6 9 6 6 6-6" /></svg
					>
				</button>
			</div>
		</div>
	{/each}

	<!-- Add section -->
	<Popover bind:open={addOpen}>
		{#snippet child({ props })}
			<button
				{...props}
				type="button"
				class="border-base-300 dark:border-base-700 hover:border-accent-500 hover:bg-accent-500/10 text-base-600 dark:text-base-400 hover:text-accent-600 dark:hover:text-accent-400 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 py-3 text-sm font-semibold transition-colors"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="2.5"
					stroke="currentColor"
					class="size-4"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
				</svg>
				Add section
			</button>
		{/snippet}
		<div class="flex flex-col gap-1 p-1">
			{#each AllSectionDefinitions as def (def.type)}
				<Button
					variant="ghost"
					size="sm"
					class="justify-start gap-2 text-sm"
					onclick={() => {
						onaddsection(def.type);
						addOpen = false;
					}}
				>
					{#if def.icon}
						<span class="text-base-500 dark:text-base-400 [&>svg]:size-4">{@html def.icon}</span>
					{/if}
					{def.name}
				</Button>
			{/each}
		</div>
	</Popover>
</div>
