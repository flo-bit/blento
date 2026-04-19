<script lang="ts">
	import type { SectionRecord, WebsiteData } from '$lib/types';
	import { SectionDefinitionsByType, AllSectionDefinitions } from '$lib/sections';
	import { getHideProfileSection } from '$lib/helper';

	let {
		open = $bindable(false),
		sections = $bindable(),
		activeSectionId = $bindable(),
		data = $bindable(),
		ondelete,
		onlayoutchange,
		onadd
	}: {
		open: boolean;
		sections: SectionRecord[];
		activeSectionId: string | undefined;
		data: WebsiteData;
		ondelete: (id: string) => void;
		onlayoutchange: () => void;
		onadd: (sectionType: string) => void;
	} = $props();

	let hideProfile = $derived(getHideProfileSection(data));

	function toggleProfile() {
		data.publication.preferences ??= {};
		data.publication.preferences.hideProfileSection = !hideProfile;
		data = { ...data };
	}

	function moveUp(index: number) {
		if (index <= 0) return;
		const sorted = sections.toSorted((a, b) => a.index - b.index);
		const prev = sorted[index - 1];
		const curr = sorted[index];
		const tmpIndex = prev.index;
		prev.index = curr.index;
		curr.index = tmpIndex;
		sections = [...sections];
		onlayoutchange();
	}

	function moveDown(index: number) {
		const sorted = sections.toSorted((a, b) => a.index - b.index);
		if (index >= sorted.length - 1) return;
		const next = sorted[index + 1];
		const curr = sorted[index];
		const tmpIndex = next.index;
		next.index = curr.index;
		curr.index = tmpIndex;
		sections = [...sections];
		onlayoutchange();
	}
</script>

<!-- Sidebar -->
<div
	class="bg-base-100 dark:bg-base-950 border-base-200 dark:border-base-800 fixed top-0 left-0 z-20 flex h-full w-72 flex-col border-r shadow-lg transition-transform duration-200 {open
		? 'translate-x-0'
		: '-translate-x-full'}"
>
	<div
		class="border-base-200 dark:border-base-800 flex items-center justify-between border-b px-4 py-3"
	>
		<h2 class="text-base-900 dark:text-base-100 text-sm font-semibold">Layout</h2>
		<button
			type="button"
			class="text-base-500 hover:text-base-700 dark:text-base-400 dark:hover:text-base-200 cursor-pointer rounded-lg p-1"
			onclick={() => (open = false)}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="size-4"
			>
				<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
			</svg>
		</button>
	</div>

	<div class="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
		<!-- Profile toggle -->
		<button
			type="button"
			class="hover:bg-base-100 dark:hover:bg-base-900 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors"
			onclick={toggleProfile}
		>
			<span class="text-base-400 dark:text-base-500 shrink-0">
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
					<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
					<circle cx="12" cy="7" r="4" />
				</svg>
			</span>
			<span class="text-base-700 dark:text-base-300 flex-1 text-sm font-medium">Profile</span>
			<span
				class="text-xs {hideProfile
					? 'text-base-400 dark:text-base-500'
					: 'text-accent-600 dark:text-accent-400'}"
			>
				{hideProfile ? 'Hidden' : 'Visible'}
			</span>
		</button>

		<div class="border-base-200 dark:border-base-800 my-1 border-t"></div>

		<!-- Sections -->
		<span class="text-base-400 dark:text-base-500 mb-0.5 px-2 text-xs font-medium">Sections</span>
		{#each sections.toSorted((a, b) => a.index - b.index) as section, i (section.id)}
			{@const def = SectionDefinitionsByType[section.sectionType]}
			<div
				class="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors {activeSectionId ===
				section.id
					? 'bg-accent-50 dark:bg-accent-950/30'
					: 'hover:bg-base-100 dark:hover:bg-base-900'}"
			>
				<button
					type="button"
					class="flex flex-1 cursor-pointer items-center gap-2 text-left"
					onclick={() => {
						activeSectionId = section.id;
					}}
				>
					{#if def?.icon}
						<span class="text-base-400 dark:text-base-500 shrink-0 [&>svg]:size-4">
							{@html def.icon}
						</span>
					{/if}
					<span
						class="text-sm font-medium {activeSectionId === section.id
							? 'text-accent-700 dark:text-accent-300'
							: 'text-base-700 dark:text-base-300'}"
					>
						{section.name || def?.name || section.sectionType}
					</span>
				</button>

				<div class="flex items-center">
					<button
						type="button"
						class="text-base-400 hover:text-base-600 dark:text-base-500 dark:hover:text-base-300 cursor-pointer rounded p-0.5 transition-colors disabled:opacity-30"
						disabled={i === 0}
						onclick={() => moveUp(i)}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="size-3.5"
						>
							<path d="m18 15-6-6-6 6" />
						</svg>
					</button>
					<button
						type="button"
						class="text-base-400 hover:text-base-600 dark:text-base-500 dark:hover:text-base-300 cursor-pointer rounded p-0.5 transition-colors disabled:opacity-30"
						disabled={i === sections.length - 1}
						onclick={() => moveDown(i)}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="size-3.5"
						>
							<path d="m6 9 6 6 6-6" />
						</svg>
					</button>
					{#if sections.length > 1}
						<button
							type="button"
							class="text-base-400 dark:text-base-500 cursor-pointer rounded p-0.5 transition-colors hover:text-rose-500"
							onclick={() => ondelete(section.id)}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="size-3.5"
							>
								<path d="M3 6h18" />
								<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
								<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
							</svg>
						</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	<!-- Add section -->
	<div class="border-base-200 dark:border-base-800 flex flex-col gap-1 border-t p-3">
		<span class="text-base-400 dark:text-base-500 mb-1 px-2 text-xs font-medium">Add section</span>
		{#each AllSectionDefinitions as def (def.type)}
			<button
				type="button"
				class="text-base-600 dark:text-base-400 hover:bg-base-100 dark:hover:bg-base-900 flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors"
				onclick={() => onadd(def.type)}
			>
				{#if def.icon}
					<span class="text-base-400 dark:text-base-500 shrink-0 [&>svg]:size-4">
						{@html def.icon}
					</span>
				{/if}
				{def.name}
			</button>
		{/each}
	</div>
</div>
