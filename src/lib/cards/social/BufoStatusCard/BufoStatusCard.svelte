<script lang="ts">
	import type { ContentComponentProps } from '../../types';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import { onMount } from 'svelte';
	import { CardDefinitionsByType } from '../..';
	import type { BufoStatusData } from '.';

	let { item }: ContentComponentProps = $props();

	const data = getAdditionalUserData();
	const did = getDidContext();
	const handle = getHandleContext();

	// svelte-ignore state_referenced_locally
	let status = $state(data[item.cardType] as BufoStatusData | undefined);
	// svelte-ignore state_referenced_locally
	let loaded = $state(status !== undefined);

	onMount(async () => {
		if (status === undefined) {
			status = (await CardDefinitionsByType[item.cardType]?.loadData?.([item], {
				did,
				handle
			})) as BufoStatusData;
			data[item.cardType] = status;
		}
		loaded = true;
	});

	const isCustom = $derived(status?.emoji?.startsWith('custom:') ?? false);
	const emojiName = $derived(isCustom ? status!.emoji.slice('custom:'.length) : null);
	const statusUrl = $derived(
		status ? `https://status.zzstoatzz.io/status/${did}/${status.rkey}` : null
	);

	function onImgError(e: Event) {
		const img = e.currentTarget as HTMLImageElement;
		if (!img.src.endsWith('.gif')) {
			img.src = `https://all-the.bufo.zone/${emojiName}.gif`;
		}
	}
</script>

<div class="relative flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center">
	<a
		href={statusUrl ?? 'https://status.zzstoatzz.io'}
		target="_blank"
		rel="noopener noreferrer"
		class="flex flex-col items-center justify-center gap-2"
	>
		{#if status}
			{#if emojiName}
				<img
					src={`https://all-the.bufo.zone/${emojiName}.png`}
					alt={emojiName}
					onerror={onImgError}
					class="max-h-16 w-auto object-contain"
				/>
			{:else}
				<span class="text-5xl leading-none">{status.emoji}</span>
			{/if}
			{#if status.text}
				<p class="line-clamp-2 text-sm font-medium opacity-80">{status.text}</p>
			{/if}
		{:else if loaded}
			<span class="text-sm opacity-40">No active status</span>
		{:else}
			<span class="text-sm opacity-40">Loading…</span>
		{/if}
	</a>
	<a
		href="https://status.zzstoatzz.io"
		target="_blank"
		rel="noopener noreferrer"
		class="absolute right-2 bottom-1.5 text-[10px] opacity-30 hover:opacity-60"
		>powered by status.zzstoatzz.io</a
	>
</div>
