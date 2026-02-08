<script lang="ts">
	import {
		putRecord,
		deleteRecord,
		listRecords,
		uploadBlob,
		getCDNImageBlobUrl
	} from '$lib/atproto/methods';
	import { user } from '$lib/atproto/auth.svelte';
	import { goto } from '$app/navigation';
	import * as TID from '@atcute/tid';
	import { Button } from '@foxui/core';
	import { loginModalState } from '$lib/atproto/UI/LoginModal.svelte';

	let { data } = $props();

	let destinationPage = $state('');
	let copying = $state(false);
	let error = $state('');
	let success = $state(false);

	const sourceHandle = $derived(data.handle);

	const sourcePage = $derived(
		data.page === 'blento.self' ? 'main' : data.page.replace('blento.', '')
	);
	const sourceCards = $derived(data.cards);

	// Re-upload blobs from source repo to current user's repo
	async function reuploadBlobs(obj: any, sourceDid: string): Promise<void> {
		if (!obj || typeof obj !== 'object') return;

		for (const key of Object.keys(obj)) {
			const value = obj[key];

			if (value && typeof value === 'object') {
				// Check if this is a blob reference
				if (value.$type === 'blob' && value.ref?.$link) {
					try {
						// Get the blob URL from source repo
						const blobUrl = getCDNImageBlobUrl({ did: sourceDid, blob: value });
						if (!blobUrl) continue;

						// Fetch the blob via proxy to avoid CORS
						const response = await fetch(`/api/image-proxy?url=${encodeURIComponent(blobUrl)}`);
						if (!response.ok) {
							console.error('Failed to fetch blob:', blobUrl);
							continue;
						}

						// Upload to current user's repo
						const blob = await response.blob();
						const newBlobRef = await uploadBlob({ blob });

						if (newBlobRef) {
							// Replace with new blob reference
							obj[key] = newBlobRef;
						}
					} catch (err) {
						console.error('Failed to re-upload blob:', err);
					}
				} else {
					// Recursively check nested objects
					await reuploadBlobs(value, sourceDid);
				}
			}
		}
	}

	async function copyPage() {
		if (!user.isLoggedIn || !user.did) {
			error = 'You must be logged in to copy pages';
			return;
		}

		copying = true;
		error = '';

		try {
			const targetPage =
				destinationPage.trim() === '' ? 'blento.self' : `blento.${destinationPage.trim()}`;

			// Fetch existing cards from destination page and delete them
			const existingCards = await listRecords({
				did: user.did,
				collection: 'app.blento.card'
			});

			const cardsToDelete = existingCards.filter(
				(card: { value: { page?: string } }) => card.value.page === targetPage
			);

			// Delete existing cards from destination page
			const deletePromises = cardsToDelete.map((card: { uri: string }) => {
				const rkey = card.uri.split('/').pop()!;
				return deleteRecord({
					collection: 'app.blento.card',
					rkey
				});
			});

			await Promise.all(deletePromises);

			// Copy each card with a new ID to the destination page
			// Re-upload blobs from source repo to current user's repo
			for (const card of sourceCards) {
				const newCard = {
					...structuredClone(card),
					id: TID.now(),
					page: targetPage,
					updatedAt: new Date().toISOString(),
					version: 2
				};

				// Re-upload any blobs in cardData
				await reuploadBlobs(newCard.cardData, data.did);

				await putRecord({
					collection: 'app.blento.card',
					rkey: newCard.id,
					record: newCard
				});
			}

			const userHandle = user.profile?.handle ?? data.handle;

			// Copy publication data if it exists
			if (data.publication) {
				const publicationCopy = structuredClone(data.publication) as Record<string, unknown>;

				// Re-upload any blobs in publication (e.g., icon)
				await reuploadBlobs(publicationCopy, data.did);

				// Update the URL to point to the user's page
				publicationCopy.url = `https://blento.app/${userHandle}`;
				if (targetPage !== 'blento.self') {
					publicationCopy.url += '/' + targetPage.replace('blento.', '');
				}

				// Save to appropriate collection based on destination page type
				if (targetPage === 'blento.self') {
					await putRecord({
						collection: 'site.standard.publication',
						rkey: targetPage,
						record: publicationCopy
					});
				} else {
					await putRecord({
						collection: 'app.blento.page',
						rkey: targetPage,
						record: publicationCopy
					});
				}
			}

			// Refresh the logged-in user's cache
			await fetch(`/${userHandle}/api/refresh`);

			success = true;

			// Redirect to the logged-in user's destination page edit
			const destPath = destinationPage.trim() === '' ? '' : `/${destinationPage.trim()}`;
			setTimeout(() => {
				goto(`/${userHandle}${destPath}/edit`);
			}, 1000);
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to copy page';
		} finally {
			copying = false;
		}
	}
</script>

<div class="bg-base-50 dark:bg-base-900 flex min-h-screen items-center justify-center p-4">
	<div class="bg-base-100 dark:bg-base-800 w-full max-w-md rounded-2xl p-6 shadow-lg">
		{#if user.isLoggedIn}
			<h1 class="text-base-900 dark:text-base-50 mb-6 text-2xl font-bold">Copy Page</h1>

			<div class="mb-4">
				<div class="text-base-700 dark:text-base-300 mb-1 block text-sm font-medium">
					Source Page
				</div>
				<div
					class="bg-base-200 dark:bg-base-700 text-base-900 dark:text-base-100 rounded-lg px-3 py-2"
				>
					{sourceHandle}/{sourcePage || 'main'}
				</div>
				<p class="text-base-500 mt-1 text-sm">{sourceCards.length} cards</p>
			</div>

			<div class="mb-6">
				<label
					for="destination"
					class="text-base-700 dark:text-base-300 mb-1 block text-sm font-medium"
				>
					Destination Page (on your profile: {user.profile?.handle})
				</label>
				<input
					id="destination"
					type="text"
					bind:value={destinationPage}
					placeholder="Leave empty for main page"
					class="bg-base-50 dark:bg-base-700 border-base-300 dark:border-base-600 text-base-900 dark:text-base-100 focus:ring-accent-500 w-full rounded-lg border px-3 py-2 focus:ring-2 focus:outline-none"
				/>
			</div>

			{#if error}
				<div
					class="mb-4 rounded-lg bg-red-100 p-3 text-red-700 dark:bg-red-900/30 dark:text-red-400"
				>
					{error}
				</div>
			{/if}

			{#if success}
				<div
					class="mb-4 rounded-lg bg-green-100 p-3 text-green-700 dark:bg-green-900/30 dark:text-green-400"
				>
					Page copied successfully! Redirecting...
				</div>
			{/if}

			<div class="flex gap-3">
				<a
					href="/{data.handle}/{sourcePage === 'main' ? '' : sourcePage}"
					class="bg-base-200 hover:bg-base-300 dark:bg-base-700 dark:hover:bg-base-600 text-base-700 dark:text-base-300 flex-1 rounded-lg px-4 py-2 text-center font-medium transition-colors"
				>
					Cancel
				</a>
				<button
					onclick={copyPage}
					disabled={copying || success}
					class="bg-accent-500 hover:bg-accent-600 flex-1 rounded-lg px-4 py-2 font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
				>
					{#if copying}
						Copying...
					{:else}
						Copy {sourceCards.length} cards
					{/if}
				</button>
			</div>
		{:else}
			<h1 class="text-base-900 dark:text-base-50 mb-6 text-2xl font-bold">
				You must be signed in to copy a page!
			</h1>

			<div class="flex w-full justify-center">
				<Button size="lg" onclick={() => loginModalState.show()}>Login</Button>
			</div>
		{/if}
	</div>
</div>
