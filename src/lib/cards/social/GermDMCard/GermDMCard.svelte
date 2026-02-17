<script lang="ts">
	import { onMount } from 'svelte';
	import { getAdditionalUserData, getDidContext, getHandleContext } from '$lib/website/context';
	import type { ContentComponentProps } from '../../types';
	import { CardDefinitionsByType } from '../..';
	import { user } from '$lib/atproto/auth.svelte';
	import { platformsData } from '../BigSocialCard';

	let { item = $bindable(), isEditing }: ContentComponentProps = $props();

	const data = getAdditionalUserData();

	let germData = $state(
		data[item.cardType] as { messageMeUrl: string; showButtonTo: string } | null | undefined
	);

	let did = getDidContext();
	let handle = getHandleContext();
	let isLoaded = $state(false);

	onMount(async () => {
		if (!germData) {
			germData = (await CardDefinitionsByType[item.cardType]?.loadData?.([], {
				did,
				handle
			})) as { messageMeUrl: string; showButtonTo: string } | null | undefined;

			data[item.cardType] = germData;
			isLoaded = true;
		}
	});

	const brandColor = `#${platformsData.germ.hex}`;

	const dmUrl = $derived.by(() => {
		if (!germData?.messageMeUrl) return undefined;
		const viewerDid = user.did;
		const fragment = viewerDid ? `${did}+${viewerDid}` : `${did}`;
		return `${germData.messageMeUrl}/web#${fragment}`;
	});
</script>

{#if germData && dmUrl}
	<div
		class="flex h-full w-full items-center justify-center p-10"
		style="background-color: {brandColor}"
	>
		<div
			class="flex aspect-square max-h-full max-w-full items-center justify-center [&_svg]:size-full [&_svg]:max-w-60 [&_svg]:fill-white"
		>
			{@html platformsData.germ.svg}
		</div>
	</div>

	{#if !isEditing}
		<a href={dmUrl} target="_blank" rel="noopener noreferrer">
			<div class="absolute inset-0 z-50"></div>
			<span class="sr-only">Message me on Germ</span>
		</a>
	{/if}
{:else if isLoaded}
	<div
		class="text-base-500 dark:text-base-400 accent:text-white/70 flex h-full w-full items-center justify-center p-4 text-center text-sm"
	>
		Germ DM not available
	</div>
{:else}
	<div
		class="text-base-500 dark:text-base-400 accent:text-white/70 flex h-full w-full items-center justify-center p-4 text-center text-sm"
	>
		Loading...
	</div>
{/if}
