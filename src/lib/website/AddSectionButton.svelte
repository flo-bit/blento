<script lang="ts">
	import { Button, Popover } from '@foxui/core';
	import { AllSectionDefinitions } from '$lib/sections';

	let {
		onadd
	}: {
		onadd: (sectionType: string) => void;
	} = $props();

	let popoverOpen = $state(false);
</script>

<div class="pointer-events-auto relative col-span-3 flex w-full items-center justify-center py-1">
	<Popover bind:open={popoverOpen}>
		{#snippet child({ props })}
			<button
				{...props}
				type="button"
				class="border-base-300 dark:border-base-700 hover:border-accent-500 hover:bg-accent-500/10 text-base-400 dark:text-base-500 hover:text-accent-600 dark:hover:text-accent-400 flex cursor-pointer items-center gap-1 rounded-full border bg-white/50 px-3 py-1 text-xs font-medium opacity-0 backdrop-blur-sm transition-all duration-150 group-hover/wrapper:opacity-60 hover:opacity-100 focus:opacity-100 dark:bg-black/30"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="size-3"
				>
					<path d="M12 5v14" />
					<path d="M5 12h14" />
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
						onadd(def.type);
						popoverOpen = false;
					}}
				>
					{#if def.icon}
						<span class="text-base-500 dark:text-base-400">
							{@html def.icon}
						</span>
					{/if}
					{def.name}
				</Button>
			{/each}
		</div>
	</Popover>
</div>
