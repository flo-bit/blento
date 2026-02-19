<script lang="ts">
	import { Avatar as FoxAvatar } from '@foxui/core';
	import { onMount } from 'svelte';
	import { fetchEventBacklinks } from './api.remote';

	let { eventUri, did }: { eventUri: string; did: string } = $props();

	let goingCount = $state(0);
	let interestedCount = $state(0);
	let goingAvatars: Array<{ did: string; avatar?: string; name: string }> = $state([]);
	let interestedAvatars: Array<{ did: string; avatar?: string; name: string }> = $state([]);
	let loading = $state(true);

	onMount(() => {
		fetchEventBacklinks(eventUri)
			.then((records) => {
				console.log(records);
				if (!records) return;
				let going = 0;
				let interested = 0;
				const goingAvatarList: Array<{ did: string; avatar?: string; name: string }> = [];
				const interestedAvatarList: Array<{ did: string; avatar?: string; name: string }> = [];

				for (const raw of records) {
					const record = raw as {
						did: string;
						value?: { status?: string };
						author?: { avatar?: string; displayName?: string; handle?: string };
					};
					const status = record.value?.status || '';
					const author = record.author;
					const avatarInfo = {
						did: record.did,
						avatar: author?.avatar,
						name: author?.displayName || author?.handle || record.did
					};

					if (status.includes('#going')) {
						going++;
						goingAvatarList.push(avatarInfo);
					} else if (status.includes('#interested')) {
						interested++;
						interestedAvatarList.push(avatarInfo);
					}
				}

				goingCount = going;
				interestedCount = interested;
				goingAvatars = goingAvatarList;
				interestedAvatars = interestedAvatarList;
			})
			.catch((err) => {
				console.error('Failed to fetch event attendees:', err);
			})
			.finally(() => {
				loading = false;
			});
	});

	let totalCount = $derived(goingCount + interestedCount);
	let allAvatars = $derived([...goingAvatars, ...interestedAvatars]);
	let displayAvatars = $derived(allAvatars.slice(0, 8));
	let overflowCount = $derived(allAvatars.length - displayAvatars.length);
</script>

{#if loading}
	<div class="flex items-center gap-3">
		<div class="bg-base-300 dark:bg-base-700 h-3 w-24 animate-pulse rounded"></div>
	</div>
{:else if totalCount > 0}
	<div>
		<p class="text-base-500 dark:text-base-400 mb-3 text-xs font-semibold tracking-wider uppercase">
			Attendees
		</p>

		<!-- Avatar stack -->
		{#if displayAvatars.length > 0}
			<div class="mb-3 flex items-center">
				<div class="flex -space-x-2">
					{#each displayAvatars as person (person.did)}
						<FoxAvatar
							src={person.avatar}
							alt={person.name}
							class="ring-base-50 dark:ring-base-950 size-7 ring-2"
						/>
					{/each}
				</div>
				{#if overflowCount > 0}
					<span class="text-base-500 dark:text-base-400 ml-2 text-xs">
						+{overflowCount}
					</span>
				{/if}
			</div>
		{/if}

		<!-- Counts -->
		<div class="text-base-600 dark:text-base-400 flex items-center gap-3 text-sm">
			{#if goingCount > 0}
				<span class="flex items-center gap-1.5">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="size-3.5 text-green-500"
					>
						<path
							fill-rule="evenodd"
							d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
							clip-rule="evenodd"
						/>
					</svg>
					{goingCount} going
				</span>
			{/if}
			{#if interestedCount > 0}
				<span class="flex items-center gap-1.5">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="size-3.5 text-amber-500"
					>
						<path
							fill-rule="evenodd"
							d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
							clip-rule="evenodd"
						/>
					</svg>
					{interestedCount} interested
				</span>
			{/if}
		</div>
	</div>
{/if}
