<script lang="ts">
	import { user } from '$lib/atproto/auth.svelte';
	import { loginModalState } from '$lib/atproto/UI/LoginModal.svelte';
	import { uploadBlob } from '$lib/atproto/methods';
	import { compressImage } from '$lib/atproto/image-helper';
	import { Button } from '@foxui/core';
	import { goto } from '$app/navigation';

	let name = $state('');
	let description = $state('');
	let startsAt = $state('');
	let endsAt = $state('');
	let thumbnailFile: File | null = $state(null);
	let thumbnailPreview: string | null = $state(null);
	let submitting = $state(false);
	let error: string | null = $state(null);

	let fileInput: HTMLInputElement | undefined = $state();

	function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		thumbnailFile = file;
		if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
		thumbnailPreview = URL.createObjectURL(file);
	}

	function removeThumbnail() {
		thumbnailFile = null;
		if (thumbnailPreview) {
			URL.revokeObjectURL(thumbnailPreview);
			thumbnailPreview = null;
		}
		if (fileInput) fileInput.value = '';
	}

	async function handleSubmit() {
		error = null;

		if (!name.trim()) {
			error = 'Name is required.';
			return;
		}
		if (!startsAt) {
			error = 'Start date is required.';
			return;
		}
		if (!user.client || !user.did) {
			error = 'You must be logged in.';
			return;
		}

		submitting = true;

		try {
			let media: Array<Record<string, unknown>> | undefined;

			if (thumbnailFile) {
				const compressed = await compressImage(thumbnailFile);
				const blobRef = await uploadBlob({ blob: compressed.blob });
				if (blobRef) {
					media = [
						{
							role: 'thumbnail',
							content: blobRef,
							aspect_ratio: {
								width: compressed.aspectRatio.width,
								height: compressed.aspectRatio.height
							}
						}
					];
				}
			}

			const record: Record<string, unknown> = {
				$type: 'community.lexicon.calendar.event',
				name: name.trim(),
				mode: 'community.lexicon.calendar.event#inperson',
				status: 'community.lexicon.calendar.event#scheduled',
				startsAt: new Date(startsAt).toISOString(),
				createdAt: new Date().toISOString()
			};

			if (description.trim()) {
				record.description = description.trim();
			}
			if (endsAt) {
				record.endsAt = new Date(endsAt).toISOString();
			}
			if (media) {
				record.media = media;
			}

			const response = await user.client.post('com.atproto.repo.createRecord', {
				input: {
					collection: 'community.lexicon.calendar.event',
					repo: user.did,
					record
				}
			});

			if (response.ok) {
				const parts = response.data.uri.split('/');
				const rkey = parts[parts.length - 1];
				const handle =
					user.profile?.handle && user.profile.handle !== 'handle.invalid'
						? user.profile.handle
						: user.did;
				goto(`/${handle}/e/${rkey}`);
			} else {
				error = 'Failed to create event. Please try again.';
			}
		} catch (e) {
			console.error('Failed to create event:', e);
			error = 'Failed to create event. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Create Event</title>
</svelte:head>

<div class="bg-base-50 dark:bg-base-950 min-h-screen px-6 py-12">
	<div class="mx-auto max-w-2xl">
		<h1 class="text-base-900 dark:text-base-50 mb-8 text-3xl font-bold">Create Event</h1>

		{#if user.isInitializing}
			<div class="flex items-center gap-3">
				<div class="bg-base-300 dark:bg-base-700 size-5 animate-pulse rounded-full"></div>
				<div class="bg-base-300 dark:bg-base-700 h-4 w-48 animate-pulse rounded"></div>
			</div>
		{:else if !user.isLoggedIn}
			<div
				class="border-base-200 dark:border-base-800 bg-base-100 dark:bg-base-900/50 rounded-2xl border p-8 text-center"
			>
				<p class="text-base-600 dark:text-base-400 mb-4">Log in to create an event.</p>
				<Button onclick={() => loginModalState.show()}>Log in</Button>
			</div>
		{:else}
			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-6"
			>
				<!-- Thumbnail -->
				<div>
					<label
						class="text-base-700 dark:text-base-300 mb-1.5 block text-sm font-medium"
						for="thumbnail"
					>
						Thumbnail
					</label>
					<input
						bind:this={fileInput}
						type="file"
						id="thumbnail"
						accept="image/*"
						onchange={onFileChange}
						class="hidden"
					/>
					{#if thumbnailPreview}
						<div class="relative inline-block">
							<img
								src={thumbnailPreview}
								alt="Thumbnail preview"
								class="border-base-200 dark:border-base-700 h-40 w-40 rounded-xl border object-cover"
							/>
							<button
								type="button"
								onclick={removeThumbnail}
								aria-label="Remove thumbnail"
								class="bg-base-900/70 absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full text-white hover:bg-red-600"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 20 20"
									fill="currentColor"
									class="size-3.5"
								>
									<path
										d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z"
									/>
								</svg>
							</button>
						</div>
					{:else}
						<button
							type="button"
							onclick={() => fileInput?.click()}
							class="border-base-300 dark:border-base-700 hover:border-base-400 dark:hover:border-base-600 text-base-500 dark:text-base-400 flex h-40 w-40 flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
								stroke-width="1.5"
								stroke="currentColor"
								class="mb-1 size-6"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
								/>
							</svg>
							<span class="text-xs">Upload image</span>
						</button>
					{/if}
				</div>

				<!-- Name -->
				<div>
					<label
						class="text-base-700 dark:text-base-300 mb-1.5 block text-sm font-medium"
						for="name"
					>
						Name <span class="text-red-500">*</span>
					</label>
					<input
						type="text"
						id="name"
						bind:value={name}
						required
						placeholder="Event name"
						class="border-base-300 dark:border-base-700 bg-base-50 dark:bg-base-900 text-base-900 dark:text-base-100 placeholder:text-base-400 dark:placeholder:text-base-600 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
				</div>

				<!-- Description -->
				<div>
					<label
						class="text-base-700 dark:text-base-300 mb-1.5 block text-sm font-medium"
						for="description"
					>
						Description
					</label>
					<textarea
						id="description"
						bind:value={description}
						rows={4}
						placeholder="What's this event about?"
						class="border-base-300 dark:border-base-700 bg-base-50 dark:bg-base-900 text-base-900 dark:text-base-100 placeholder:text-base-400 dark:placeholder:text-base-600 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
					></textarea>
				</div>

				<!-- Start date/time -->
				<div>
					<label
						class="text-base-700 dark:text-base-300 mb-1.5 block text-sm font-medium"
						for="startsAt"
					>
						Start date & time <span class="text-red-500">*</span>
					</label>
					<input
						type="datetime-local"
						id="startsAt"
						bind:value={startsAt}
						required
						class="border-base-300 dark:border-base-700 bg-base-50 dark:bg-base-900 text-base-900 dark:text-base-100 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
				</div>

				<!-- End date/time -->
				<div>
					<label
						class="text-base-700 dark:text-base-300 mb-1.5 block text-sm font-medium"
						for="endsAt"
					>
						End date & time
					</label>
					<input
						type="datetime-local"
						id="endsAt"
						bind:value={endsAt}
						class="border-base-300 dark:border-base-700 bg-base-50 dark:bg-base-900 text-base-900 dark:text-base-100 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
					/>
				</div>

				{#if error}
					<p class="text-sm text-red-600 dark:text-red-400">{error}</p>
				{/if}

				<Button type="submit" disabled={submitting} class="w-full">
					{submitting ? 'Creating...' : 'Create Event'}
				</Button>
			</form>
		{/if}
	</div>
</div>
