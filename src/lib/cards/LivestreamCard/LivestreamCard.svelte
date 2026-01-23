<script lang="ts">
	import { onMount } from 'svelte';
	import Icon from './Icon.svelte';
	import {
		getAdditionalUserData,
		getDidContext,
		getHandleContext,
		getIsMobile
	} from '$lib/website/context';
	import type { ContentComponentProps } from '../types';
	import { RelativeTime } from '@foxui/time';
	import { Badge } from '@foxui/core';
	import { CardDefinitionsByType } from '..';
	import { browser } from '$app/environment';

	let { item = $bindable() }: ContentComponentProps = $props();

	let isMobile = getIsMobile();

	let isLoaded = $state(false);

	const data = getAdditionalUserData();

	let latestLivestream = $state(
		data[item.cardType] as
			| {
					createdAt: string;
					title: string;
					thumb?: string;
					href: string;
					online?: boolean;
			  }
			| undefined
	);

	let did = getDidContext();
	let handle = getHandleContext();

	onMount(async () => {
		if (!latestLivestream) {
			latestLivestream = (await CardDefinitionsByType[item.cardType]?.loadData?.([], {
				did,
				handle
			})) as
				| {
						createdAt: string;
						title: string;
						thumb?: string;
						href: string;
						online?: boolean;
				  }
				| undefined;

			data[item.cardType] = latestLivestream;

			isLoaded = true;
		}
	});
</script>

<div class="h-full overflow-y-scroll p-4">
	{#if latestLivestream}
		<div class="flex min-h-full flex-col justify-between">
			<div>
				<div class="mb-4 flex items-center gap-2">
					<Icon class="size-6" />
					<div class="font-semibold">Latest Livestream</div>
				</div>

				<div class="mb-2 flex items-center gap-2">
					<div class="text-xs font-medium">
						started <RelativeTime date={new Date(latestLivestream.createdAt)} locale="en-US" /> ago
					</div>
					{#if latestLivestream.online === true}
						<Badge size="sm">
							<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
								<circle cx="50" cy="50" r="30" fill="currentColor" />
							</svg>

							<span class="accent:text-base-900">live</span></Badge
						>
					{:else if latestLivestream.online === false}
						<Badge size="sm" class="accent:text-base-900">ended</Badge>
					{:else}
						<div class="h-5.5"></div>
					{/if}
				</div>

				<a href={latestLivestream?.href} target="_blank" rel="noopener noreferrer">
					<div
						class="text-accent-700 dark:text-accent-300 accent:text-accent-950 hover:accent:text-accent-900 hover:text-accent-600 dark:hover:text-accent-400 text-xl font-semibold transition-colors duration-150"
					>
						{latestLivestream?.title}
					</div>
				</a>
			</div>

			{#if browser && ((isMobile() && item.mobileH >= 7) || (!isMobile() && item.h >= 4)) && latestLivestream?.thumb}
				<a href={latestLivestream?.href} target="_blank" rel="noopener noreferrer">
					<img
						class="my-4 max-h-32 w-full rounded-xl object-cover"
						src={latestLivestream?.thumb}
						alt=""
					/>
					<span class="sr-only">open livestream</span>
				</a>
			{/if}
		</div>
	{:else if isLoaded}
		<div class="flex h-full w-full items-center justify-center">No latest stream found!</div>
	{:else}
		<div class="flex h-full w-full items-center justify-center">Looking for the latest stream</div>
	{/if}
</div>
