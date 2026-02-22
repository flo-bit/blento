<script lang="ts">
	import { Avatar as FoxAvatar } from '@foxui/core';
	import { onMount } from 'svelte';
	import { scale } from 'svelte/transition';
	import { flip } from 'svelte/animate';
	import { fetchEventAttendees, type AttendeeInfo } from './api.remote';
	import Modal from '$lib/components/modal/Modal.svelte';

	let { eventUri }: { eventUri: string } = $props();

	let goingCount = $state(0);
	let interestedCount = $state(0);
	let goingAttendees: AttendeeInfo[] = $state([]);
	let interestedAttendees: AttendeeInfo[] = $state([]);
	let loading = $state(true);

	let modalOpen = $state(false);
	let modalGroup: 'going' | 'interested' = $state('going');

	const MAX_AVATARS = 18;

	onMount(async () => {
		try {
			const result = await fetchEventAttendees(eventUri);
			if (!result) return;
			goingCount = result.goingCount;
			interestedCount = result.interestedCount;
			goingAttendees = result.going;
			interestedAttendees = result.interested;
		} catch (err) {
			console.error('Failed to fetch event attendees:', err);
		} finally {
			loading = false;
		}
	});

	let totalCount = $derived(goingCount + interestedCount);

	let goingDisplay = $derived(goingAttendees.slice(0, MAX_AVATARS));
	let goingOverflow = $derived(goingCount - goingDisplay.length);

	let interestedDisplay = $derived(interestedAttendees.slice(0, MAX_AVATARS));
	let interestedOverflow = $derived(interestedCount - interestedDisplay.length);

	let modalAttendees = $derived(modalGroup === 'going' ? goingAttendees : interestedAttendees);
	let modalTitle = $derived(modalGroup === 'going' ? 'Going' : 'Interested');

	function openModal(group: 'going' | 'interested') {
		modalGroup = group;
		modalOpen = true;
	}

	export function addAttendee(attendee: AttendeeInfo) {
		// Remove from both lists first (in case of status change)
		goingAttendees = goingAttendees.filter((a) => a.did !== attendee.did);
		interestedAttendees = interestedAttendees.filter((a) => a.did !== attendee.did);

		if (attendee.status === 'going') {
			goingAttendees = [attendee, ...goingAttendees];
			goingCount = goingAttendees.length;
		} else if (attendee.status === 'interested') {
			interestedAttendees = [attendee, ...interestedAttendees];
			interestedCount = interestedAttendees.length;
		}
	}

	function thumbnail(url: string | undefined) {
		return url?.replace('/avatar/', '/avatar_thumbnail/');
	}

	export function removeAttendee(did: string) {
		const wasGoing = goingAttendees.some((a) => a.did === did);
		const wasInterested = interestedAttendees.some((a) => a.did === did);
		goingAttendees = goingAttendees.filter((a) => a.did !== did);
		interestedAttendees = interestedAttendees.filter((a) => a.did !== did);
		if (wasGoing) goingCount = goingAttendees.length;
		if (wasInterested) interestedCount = interestedAttendees.length;
	}
</script>

{#if loading}
	<div class="flex items-center gap-3">
		<div class="bg-base-300 dark:bg-base-700 h-3 w-24 animate-pulse rounded"></div>
	</div>
{:else if totalCount > 0}
	<div class="mb-2">
		{#if goingCount > 0}
			<button
				type="button"
				class="hover:bg-base-100 dark:hover:bg-base-800/50 -mx-2 block w-full cursor-pointer rounded-xl px-2 py-2 text-left transition-colors"
				onclick={() => openModal('going')}
			>
				<p class="text-base-900 dark:text-base-50 mb-2 text-sm">
					<span class="font-bold">{goingCount}</span>
					<span
						class="text-base-500 dark:text-base-400 text-xs font-semibold tracking-wider uppercase"
						>Going</span
					>
				</p>
				<div class="flex items-center">
					<div class="flex flex-wrap -space-y-2 -space-x-4 pr-4">
						{#each goingDisplay as person (person.did)}
							<div
								animate:flip={{ duration: 300 }}
								in:scale={{ duration: 300, start: 0.5 }}
								out:scale={{ duration: 200, start: 0.5 }}
							>
								<FoxAvatar
									src={thumbnail(person.avatar)}
									alt={person.name}
									class="border-base-100 dark:border-base-900 size-12 border-2"
								/>
							</div>
						{/each}
						{#if goingOverflow > 0}
							<span
								class="bg-base-200 dark:bg-base-800 text-base-950 dark:text-base-100 border-base-100 dark:border-base-900 z-10 inline-flex size-12 items-center justify-center rounded-full border-2 text-sm font-semibold"
							>
								+{goingOverflow}
							</span>
						{/if}
					</div>
				</div>
			</button>
		{/if}

		{#if interestedCount > 0}
			<button
				type="button"
				class="hover:bg-base-100 dark:hover:bg-base-800/50 -mx-2 mt-4 block w-full cursor-pointer rounded-xl px-2 py-2 text-left transition-colors"
				onclick={() => openModal('interested')}
			>
				<p class="text-base-900 dark:text-base-50 mb-2 text-sm">
					<span class="font-bold">{interestedCount}</span>
					<span
						class="text-base-500 dark:text-base-400 text-xs font-semibold tracking-wider uppercase"
						>Interested</span
					>
				</p>
				<div class="flex items-center">
					<div class="flex flex-wrap -space-y-2 -space-x-4 pr-4">
						{#each interestedDisplay as person (person.did)}
							<div
								animate:flip={{ duration: 300 }}
								in:scale={{ duration: 300, start: 0.5 }}
								out:scale={{ duration: 200, start: 0.5 }}
							>
								<FoxAvatar
									src={thumbnail(person.avatar)}
									alt={person.name}
									class="border-base-100 dark:border-base-900 size-12 border-2"
								/>
							</div>
						{/each}
						{#if interestedOverflow > 0}
							<span
								class="bg-base-200 dark:bg-base-800 text-base-950 dark:text-base-100 border-base-100 dark:border-base-900 z-10 inline-flex size-12 items-center justify-center rounded-full border-2 text-sm font-semibold"
							>
								+{interestedOverflow}
							</span>
						{/if}
					</div>
				</div>
			</button>
		{/if}
	</div>
{/if}

<Modal bind:open={modalOpen} closeButton onOpenAutoFocus={(e: Event) => e.preventDefault()} class="p-0">
	<p class="text-base-900 dark:text-base-50 px-4 pt-4 text-lg font-semibold">
		{modalTitle}
		<span class="text-base-500 dark:text-base-400 text-sm font-normal">
			({modalAttendees.length})
		</span>
	</p>
	<div
		class="dark:bg-base-900/50 bg-base-200/30 mx-4 mb-4 max-h-80 space-y-1 overflow-y-auto rounded-xl p-2"
	>
		{#each modalAttendees as person (person.did)}
			<a
				href={person.url}
				target={person.url?.startsWith('/') ? undefined : '_blank'}
				rel={person.url?.startsWith('/') ? undefined : 'noopener noreferrer'}
				class="hover:bg-base-200 dark:hover:bg-base-900 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors"
			>
				<FoxAvatar src={thumbnail(person.avatar)} alt={person.name} class="size-10 shrink-0" />
				<div class="min-w-0">
					<p class="text-base-900 dark:text-base-50 truncate text-sm font-medium">
						{person.name}
					</p>
					{#if person.handle}
						<p class="text-base-500 dark:text-base-400 truncate text-xs">
							@{person.handle}
						</p>
					{/if}
				</div>
			</a>
		{/each}
	</div>
</Modal>
