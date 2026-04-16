<script lang="ts">
	import { Button, Modal } from '@foxui/core';
	import type { SectionRecord } from '$lib/types';
	import { SectionDefinitionsByType } from '$lib/sections';

	let {
		open = $bindable(false),
		sections = $bindable(),
		ondelete,
		onlayoutchange
	}: {
		open: boolean;
		sections: SectionRecord[];
		ondelete: (id: string) => void;
		onlayoutchange: () => void;
	} = $props();

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

<Modal bind:open>
	<div class="flex flex-col gap-4">
		<h2 class="text-lg font-semibold">Sections</h2>

		{#if sections.length === 0}
			<p class="text-base-500 dark:text-base-400 text-sm">No sections yet.</p>
		{/if}

		<div class="flex flex-col gap-2">
			{#each sections.toSorted((a, b) => a.index - b.index) as section, i (section.id)}
				{@const def = SectionDefinitionsByType[section.sectionType]}
				<div
					class="border-base-200 dark:border-base-800 flex items-center gap-3 rounded-xl border p-3"
				>
					{#if def?.icon}
						<span class="text-base-500 dark:text-base-400 shrink-0">
							{@html def.icon}
						</span>
					{/if}

					<div class="flex flex-1 flex-col">
						<span class="text-sm font-medium">
							{section.name || def?.name || section.sectionType}
						</span>
					</div>

					<div class="flex items-center gap-1">
						<Button
							size="sm"
							variant="ghost"
							disabled={i === 0}
							onclick={() => moveUp(i)}
							class="size-8 min-w-8"
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
								<path d="m18 15-6-6-6 6" />
							</svg>
						</Button>
						<Button
							size="sm"
							variant="ghost"
							disabled={i === sections.length - 1}
							onclick={() => moveDown(i)}
							class="size-8 min-w-8"
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
								<path d="m6 9 6 6 6-6" />
							</svg>
						</Button>
						{#if sections.length > 1}
							<Button
								size="sm"
								variant="ghost"
								onclick={() => ondelete(section.id)}
								class="size-8 min-w-8 text-rose-500"
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
									<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
									<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
								</svg>
							</Button>
						{/if}
					</div>
				</div>
			{/each}
		</div>

		<Button variant="ghost" onclick={() => (open = false)}>Done</Button>
	</div>
</Modal>
