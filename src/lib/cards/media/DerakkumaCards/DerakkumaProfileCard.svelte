<script lang="ts">
	import type { Item } from '$lib/types';
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/data/context';
	import { CardDefinitionsByType } from '../..';
	import { blobUrl, type DerakkumaProfileValue, type RepoRecord } from './shared';

	let { item }: { item: Item } = $props();
	const data = getAdditionalUserData();
	// svelte-ignore state_referenced_locally
	let profile = $state(data[item.cardType] as RepoRecord<DerakkumaProfileValue> | undefined);
	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		if (profile) return;
		profile = (await CardDefinitionsByType[item.cardType]?.loadData?.([], { did, handle })) as
			| RepoRecord<DerakkumaProfileValue>
			| undefined;
		data[item.cardType] = profile;
	});

	let value = $derived(profile?.value);
	let profileImage = $derived(blobUrl(did, value?.profileImage));
	let ratingPlate = $derived(blobUrl(did, value?.ratingPlateImage));
	let trophyPlate = $derived(blobUrl(did, value?.trophyPlateImage));
	let partner = $derived(blobUrl(did, value?.partnerImage));
	let course = $derived(blobUrl(did, value?.courseImage));
	let classImage = $derived(blobUrl(did, value?.classImage));
	let profileImageHasError = $state(false);
</script>

<div class="flex h-full w-full flex-col gap-3 overflow-hidden p-4">
	{#if value}
		<div class="flex min-h-0 flex-1 gap-3">
			<div class="size-20 shrink-0">
				{#if profileImage && !profileImageHasError}
					<img
						src={profileImage}
						alt={value.playerName ?? ''}
						class="h-full w-full rounded-xl object-cover"
						onerror={() => {
							profileImageHasError = true;
						}}
					/>
				{:else}
					<div
						class="bg-base-200 dark:bg-base-800 accent:bg-accent-700/40 flex h-full w-full items-center justify-center rounded-xl text-lg"
					>
						🐻
					</div>
				{/if}
			</div>
			<div class="min-w-0 flex-1">
				<div class="text-accent-500 accent:text-accent-950 truncate text-lg font-bold">
					{value.playerName || 'Derakkuma'}
				</div>
				{#if value.friendCode}
					<div class="text-base-500 dark:text-base-400 accent:text-accent-950/70 truncate text-xs">
						Friend code {value.friendCode}
					</div>
				{/if}
				<div class="mt-2 flex flex-col gap-1.5">
					{#if trophyPlate}
						<div class="relative h-7 overflow-hidden rounded-md">
							<img src={trophyPlate} alt="" class="absolute inset-0 h-full w-full object-fill" />
							<div
								class="relative flex h-full items-center justify-center px-2 text-xs font-semibold text-white [text-shadow:0_1px_4px_rgba(0,0,0,.95)]"
							>
								{value.title}
							</div>
						</div>
					{/if}
					<div class="flex items-center gap-2">
						{#if ratingPlate}
							<div class="relative h-8 w-24 overflow-hidden rounded-md">
								<img src={ratingPlate} alt="" class="absolute inset-0 h-full w-full object-fill" />
								<div
									class="relative flex h-full items-center justify-end pr-2 text-sm font-black text-white [text-shadow:0_1px_4px_rgba(0,0,0,.95)]"
								>
									{value.rating ?? 0}
								</div>
							</div>
						{/if}
						{#if course}<img src={course} alt="" class="h-6 w-11 object-contain" />{/if}
						{#if value.stars}<span class="text-sm font-semibold">⭐×{value.stars}</span>{/if}
						{#if classImage}<img src={classImage} alt="" class="h-6 w-11 object-contain" />{/if}
					</div>
				</div>
			</div>
			{#if partner}
				<img
					src={partner}
					alt=""
					class="hidden h-full max-h-28 w-20 shrink-0 object-contain @lg:block"
				/>
			{/if}
		</div>
	{:else}
		<div
			class="text-base-500 dark:text-base-400 accent:text-white/60 flex h-full items-center justify-center text-center text-sm"
		>
			Loading Derakkuma profile...
		</div>
	{/if}
</div>
