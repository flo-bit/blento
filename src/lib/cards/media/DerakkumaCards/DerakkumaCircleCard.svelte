<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import { CardDefinitionsByType } from '../..';
	import { blobUrl, type DerakkumaCircleValue, type RepoRecord } from './shared';

	let { item }: { item: Item } = $props();
	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let circle = $state(data[item.cardType] as RepoRecord<DerakkumaCircleValue> | undefined);
	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		if (circle) return;
		circle = (await CardDefinitionsByType[item.cardType]?.loadData?.([], { did, handle })) as
			| RepoRecord<DerakkumaCircleValue>
			| undefined;
		data[item.cardType] = circle;
	});

	let value = $derived(circle?.value);
	let characterImage = $derived(blobUrl(did, value?.characterImage));
	let backgroundImage = $derived(blobUrl(did, value?.backgroundImage));
</script>

<div class="relative h-full w-full overflow-hidden">
	{#if value}
		{#if backgroundImage}
			<img
				src={backgroundImage}
				alt=""
				class="absolute inset-0 h-full w-full object-cover opacity-30"
			/>
			<div
				class="accent:from-accent-300/80 accent:via-accent-300/60 accent:to-accent-500/30 absolute inset-0 bg-gradient-to-br from-white/80 via-white/70 to-white/30 dark:from-black/80 dark:via-black/70 dark:to-black/30"
			></div>
		{/if}

		<div class="relative flex h-full gap-3 p-4">
			<div class="flex min-w-0 flex-1 flex-col">
				<div class="text-accent-500 accent:text-accent-950 truncate text-lg font-black">
					{value.name || 'Derakkuma Circle'}
				</div>

				<div class="mt-1 flex flex-wrap gap-1.5 text-xs font-semibold">
					{#if value.rank}
						<span
							class="accent:bg-accent-950/15 rounded-full bg-black/10 px-2 py-0.5 dark:bg-white/10"
						>
							Rank {value.rank}
						</span>
					{/if}
					{#if value.totalPoints !== undefined}
						<span
							class="accent:bg-accent-950/15 rounded-full bg-black/10 px-2 py-0.5 dark:bg-white/10"
						>
							{value.totalPoints} pts
						</span>
					{/if}
				</div>

				{#if value.comment}
					<div
						class="text-base-600 dark:text-base-300 accent:text-accent-950/80 mt-2 line-clamp-2 text-sm"
					>
						{value.comment}
					</div>
				{/if}

				<div
					class="text-base-500 dark:text-base-400 accent:text-accent-950/70 mt-auto flex flex-col gap-0.5 text-xs"
				>
					{#if value.ownerName}
						<div class="truncate">Owner {value.ownerName}</div>
					{/if}
					{#if value.circleCode}
						<div class="truncate">Circle code {value.circleCode}</div>
					{/if}
					{#if value.daysUntilReset && value.daysUntilReset > 0}
						<div>{value.daysUntilReset} days left</div>
					{/if}
					{#if value.nextRewardPoints && value.nextRewardPoints > 0}
						<div>{value.nextRewardPoints} pts to next reward</div>
					{/if}
				</div>
			</div>

			{#if characterImage}
				<img src={characterImage} alt="" class="h-full max-h-36 w-24 shrink-0 object-contain" />
			{/if}
		</div>
	{:else}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center p-4 text-center text-sm"
		>
			Loading Derakkuma circle...
		</div>
	{/if}
</div>
