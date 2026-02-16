<script lang="ts">
	import { user } from '$lib/atproto/auth.svelte';
	import { loginModalState } from '$lib/atproto/UI/LoginModal.svelte';
	import { Avatar, Button } from '@foxui/core';

	let { eventUri, eventCid }: { eventUri: string; eventCid: string | null } = $props();

	let rsvpStatus: 'going' | 'interested' | 'notgoing' | null = $state(null);
	let rsvpRkey: string | null = $state(null);
	let rsvpLoading = $state(false);
	let rsvpSubmitting = $state(false);

	$effect(() => {
		const userDid = user.did;
		if (!userDid || user.isInitializing) {
			rsvpStatus = null;
			rsvpRkey = null;
			return;
		}

		rsvpLoading = true;

		fetch(
			`https://smokesignal.events/xrpc/community.lexicon.calendar.getRSVP?identity=${encodeURIComponent(userDid)}&event=${encodeURIComponent(eventUri)}`
		)
			.then((res) => {
				if (!res.ok) {
					rsvpStatus = null;
					rsvpRkey = null;
					return;
				}
				return res.json();
			})
			.then((data) => {
				if (!data?.record?.status) {
					rsvpStatus = null;
					rsvpRkey = null;
					return;
				}
				if (data.uri) {
					const parts = data.uri.split('/');
					rsvpRkey = parts[parts.length - 1];
				}
				const status = data.record.status as string;
				if (status.includes('#going')) rsvpStatus = 'going';
				else if (status.includes('#interested')) rsvpStatus = 'interested';
				else if (status.includes('#notgoing')) rsvpStatus = 'notgoing';
				else rsvpStatus = null;
			})
			.catch(() => {
				rsvpStatus = null;
				rsvpRkey = null;
			})
			.finally(() => {
				rsvpLoading = false;
			});
	});

	async function submitRsvp(status: 'going' | 'interested') {
		if (!user.client || !user.did) return;
		rsvpSubmitting = true;
		try {
			if (rsvpRkey) {
				await user.client.post('com.atproto.repo.deleteRecord', {
					input: {
						collection: 'community.lexicon.calendar.rsvp',
						repo: user.did,
						rkey: rsvpRkey
					}
				});
			}

			const response = await user.client.post('com.atproto.repo.createRecord', {
				input: {
					collection: 'community.lexicon.calendar.rsvp',
					repo: user.did,
					record: {
						$type: 'community.lexicon.calendar.rsvp',
						status: `community.lexicon.calendar.rsvp#${status}`,
						subject: {
							uri: eventUri,
							...(eventCid ? { cid: eventCid } : {})
						},
						createdAt: new Date().toISOString()
					}
				}
			});

			if (response.ok) {
				rsvpStatus = status;
				const parts = response.data.uri.split('/');
				rsvpRkey = parts[parts.length - 1];
			}
		} catch (e) {
			console.error('Failed to submit RSVP:', e);
		} finally {
			rsvpSubmitting = false;
		}
	}

	async function cancelRsvp() {
		if (!user.client || !user.did || !rsvpRkey) return;
		rsvpSubmitting = true;
		try {
			await user.client.post('com.atproto.repo.deleteRecord', {
				input: {
					collection: 'community.lexicon.calendar.rsvp',
					repo: user.did,
					rkey: rsvpRkey
				}
			});
			rsvpStatus = null;
			rsvpRkey = null;
		} catch (e) {
			console.error('Failed to cancel RSVP:', e);
		} finally {
			rsvpSubmitting = false;
		}
	}
</script>

<div
	class="border-base-200 dark:border-base-800 bg-base-100 dark:bg-base-900/50 mt-8 mb-2 rounded-2xl border p-4"
>
	{#if user.isInitializing || rsvpLoading}
		<div class="flex items-center gap-3">
			<div class="bg-base-300 dark:bg-base-700 size-5 animate-pulse rounded-full"></div>
			<div class="bg-base-300 dark:bg-base-700 h-4 w-32 animate-pulse rounded"></div>
		</div>
	{:else if !user.isLoggedIn}
		<div class="flex items-center justify-between gap-4">
			<p class="text-base-600 dark:text-base-400 text-sm">Log in to RSVP to this event</p>

			<Button onclick={() => loginModalState.show()}>Log in to RSVP</Button>
		</div>
	{:else if rsvpStatus === 'going'}
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="flex size-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="size-4 text-green-600 dark:text-green-400"
					>
						<path
							fill-rule="evenodd"
							d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<p class="text-base-900 dark:text-base-50 font-semibold">You're Going</p>
			</div>
			<Button onclick={cancelRsvp} disabled={rsvpSubmitting} variant="ghost">Remove</Button>
		</div>
	{:else if rsvpStatus === 'interested'}
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="flex size-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="size-4 text-amber-600 dark:text-amber-400"
					>
						<path
							fill-rule="evenodd"
							d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
							clip-rule="evenodd"
						/>
					</svg>
				</div>
				<p class="text-base-900 dark:text-base-50 font-semibold">You're Interested</p>
			</div>
			<Button onclick={cancelRsvp} disabled={rsvpSubmitting} variant="ghost">Remove</Button>
		</div>
	{:else if rsvpStatus === 'notgoing'}
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-3">
				<div
					class="flex size-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 20 20"
						fill="currentColor"
						class="size-4 text-red-600 dark:text-red-400"
					>
						<path
							d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
						/>
					</svg>
				</div>
				<p class="text-base-900 dark:text-base-50 font-semibold">Not Going</p>
			</div>
			<Button onclick={cancelRsvp} disabled={rsvpSubmitting} variant="ghost">Remove</Button>
		</div>
	{:else}
		{#if user.profile}
			<div class="mb-4 flex items-center gap-2">
				<span class="text-base-500 dark:text-base-400 text-sm">RSVPing as</span>
				<Avatar
					src={user.profile.avatar}
					alt={user.profile.displayName || user.profile.handle}
					class="size-5"
				/>
				<span class="text-base-700 dark:text-base-300 truncate text-sm font-medium">
					{user.profile.displayName || user.profile.handle}
				</span>
			</div>
		{/if}
		<div class="flex gap-3">
			<Button onclick={() => submitRsvp('going')} disabled={rsvpSubmitting} class="flex-1">
				{rsvpSubmitting ? '...' : 'Going'}
			</Button>
			<Button
				onclick={() => submitRsvp('interested')}
				disabled={rsvpSubmitting}
				variant="secondary"
				class="flex-1"
			>
				{rsvpSubmitting ? '...' : 'Interested'}
			</Button>
		</div>
	{/if}
</div>
