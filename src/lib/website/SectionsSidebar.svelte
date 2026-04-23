<script lang="ts">
	import type { SectionRecord, WebsiteData } from '$lib/types';
	import { SectionDefinitionsByType } from '$lib/sections';
	import { getHideProfileSection, getProfilePosition } from '$lib/helper';

	let {
		open = $bindable(false),
		sections = $bindable(),
		activeSectionId = $bindable(),
		data = $bindable()
	}: {
		open: boolean;
		sections: SectionRecord[];
		activeSectionId: string | undefined;
		data: WebsiteData;
	} = $props();

	let hideProfile = $derived(getHideProfileSection(data));
	let profilePosition = $derived(getProfilePosition(data));

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

	const sortedSections = $derived(sections.toSorted((a, b) => a.index - b.index));
</script>

<!-- Sidebar -->
<div
	class="bg-base-100 dark:bg-base-950 border-base-200 dark:border-base-800 fixed top-26 bottom-0 left-0 z-40 flex w-64 flex-col border-r shadow-lg transition-transform duration-200 {open
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
			aria-label="Close layout sidebar"
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

	<div class="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
		<!-- Profile card -->
		<div
			class="bg-base-50 dark:bg-base-900 border-base-200 dark:border-base-800 flex flex-col gap-2 rounded-xl border p-3"
		>
			<div class="flex items-center gap-2">
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
				<div
					class="border-base-200 dark:border-base-800 bg-base-100 dark:bg-base-950 flex overflow-hidden rounded-lg border p-0.5 text-xs font-medium"
				>
					<button
						type="button"
						class="flex-1 cursor-pointer rounded-md px-2 py-1 transition-colors {profilePosition ===
						'side'
							? 'bg-accent-500 text-white'
							: 'text-base-600 dark:text-base-400 hover:bg-base-200 dark:hover:bg-base-800'}"
						onclick={() => setProfilePosition('side')}
					>
						On side
					</button>
					<button
						type="button"
						class="flex-1 cursor-pointer rounded-md px-2 py-1 transition-colors {profilePosition ===
						'top'
							? 'bg-accent-500 text-white'
							: 'text-base-600 dark:text-base-400 hover:bg-base-200 dark:hover:bg-base-800'}"
						onclick={() => setProfilePosition('top')}
					>
						On top
					</button>
				</div>
			{/if}
		</div>

		<!-- Section cards -->
		{#each sortedSections as section (section.id)}
			{@const def = SectionDefinitionsByType[section.sectionType]}
			<button
				type="button"
				class="flex w-full cursor-pointer items-center gap-2 rounded-xl border p-3 text-left transition-colors {activeSectionId ===
				section.id
					? 'border-accent-500 bg-accent-50 dark:bg-accent-950/30'
					: 'border-base-200 dark:border-base-800 bg-base-50 dark:bg-base-900 hover:bg-base-100 dark:hover:bg-base-800'}"
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
					class="flex-1 truncate text-sm font-medium {activeSectionId === section.id
						? 'text-accent-700 dark:text-accent-300'
						: 'text-base-700 dark:text-base-300'}"
				>
					{section.name || def?.name || section.sectionType}
				</span>
			</button>
		{/each}

		<button
			type="button"
			class="border-base-300 dark:border-base-700 hover:border-accent-500 hover:bg-accent-500/10 text-base-600 dark:text-base-400 hover:text-accent-600 dark:hover:text-accent-400 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-3 py-4 text-sm font-semibold transition-colors"
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
	</div>
</div>
