<script lang="ts">
	import { user } from '$lib/atproto/auth.svelte';
	import { loginModalState } from '$lib/atproto/UI/LoginModal.svelte';
	import { uploadBlob, resolveHandle } from '$lib/atproto/methods';
	import { compressImage } from '$lib/atproto/image-helper';
	import { Avatar as FoxAvatar, Badge, Button, ToggleGroup, ToggleGroupItem } from '@foxui/core';
	import { goto } from '$app/navigation';
	import { tokenize, type Token } from '@atcute/bluesky-richtext-parser';
	import type { Handle } from '@atcute/lexicons';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { putImage, getImage, deleteImage } from '$lib/components/image-store';

	const DRAFT_KEY = 'blento-event-draft';

	type EventMode = 'inperson' | 'virtual' | 'hybrid';

	interface EventDraft {
		name: string;
		description: string;
		startsAt: string;
		endsAt: string;
		links: Array<{ uri: string; name: string }>;
		mode?: EventMode;
		thumbnailKey?: string;
	}

	let thumbnailKey: string | null = $state(null);

	let name = $state('');
	let description = $state('');
	let startsAt = $state('');
	let endsAt = $state('');
	let mode: EventMode = $state('inperson');
	let thumbnailFile: File | null = $state(null);
	let thumbnailPreview: string | null = $state(null);
	let submitting = $state(false);
	let error: string | null = $state(null);

	let links: Array<{ uri: string; name: string }> = $state([]);
	let showLinkPopup = $state(false);
	let newLinkUri = $state('');
	let newLinkName = $state('');

	let hasDraft = $state(false);
	let draftLoaded = $state(false);

	onMount(async () => {
		const saved = localStorage.getItem(DRAFT_KEY);
		if (saved) {
			try {
				const draft: EventDraft = JSON.parse(saved);
				name = draft.name || '';
				description = draft.description || '';
				startsAt = draft.startsAt || '';
				endsAt = draft.endsAt || '';
				links = draft.links || [];
				mode = draft.mode || 'inperson';

				if (draft.thumbnailKey) {
					const img = await getImage(draft.thumbnailKey);
					if (img) {
						thumbnailKey = draft.thumbnailKey;
						thumbnailFile = new File([img.blob], img.name, { type: img.blob.type });
						thumbnailPreview = URL.createObjectURL(img.blob);
					}
				}

				hasDraft = true;
			} catch {
				localStorage.removeItem(DRAFT_KEY);
			}
		}
		draftLoaded = true;
	});

	let saveDraftTimeout: ReturnType<typeof setTimeout> | undefined;

	function saveDraft() {
		if (!draftLoaded || !browser) return;
		clearTimeout(saveDraftTimeout);
		saveDraftTimeout = setTimeout(() => {
			const draft: EventDraft = { name, description, startsAt, endsAt, links, mode };
			if (thumbnailKey) draft.thumbnailKey = thumbnailKey;
			const hasContent = name || description || startsAt || endsAt || links.length > 0;
			if (hasContent) {
				localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
				hasDraft = true;
			} else {
				localStorage.removeItem(DRAFT_KEY);
				hasDraft = false;
			}
		}, 500);
	}

	$effect(() => {
		// track all draft fields by reading them
		void [name, description, startsAt, endsAt, mode, JSON.stringify(links)];
		saveDraft();
	});

	function deleteDraft() {
		localStorage.removeItem(DRAFT_KEY);
		if (thumbnailKey) deleteImage(thumbnailKey);
		name = '';
		description = '';
		startsAt = '';
		endsAt = '';
		links = [];
		mode = 'inperson';
		thumbnailFile = null;
		if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
		thumbnailPreview = null;
		thumbnailKey = null;
		hasDraft = false;
	}

	function addLink() {
		const uri = newLinkUri.trim();
		if (!uri) return;
		links.push({ uri, name: newLinkName.trim() });
		newLinkUri = '';
		newLinkName = '';
		showLinkPopup = false;
	}

	function removeLink(index: number) {
		links.splice(index, 1);
	}

	let fileInput: HTMLInputElement | undefined = $state();

	let hostName = $derived(user.profile?.displayName || user.profile?.handle || user.did || '');

	async function setThumbnail(file: File) {
		thumbnailFile = file;
		if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
		thumbnailPreview = URL.createObjectURL(file);

		if (thumbnailKey) await deleteImage(thumbnailKey);
		thumbnailKey = crypto.randomUUID();
		await putImage(thumbnailKey, file, file.name);
		saveDraft();
	}

	async function onFileChange(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		setThumbnail(file);
	}

	let isDragOver = $state(false);

	function onDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOver = true;
	}

	function onDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
	}

	function onDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
		const file = e.dataTransfer?.files?.[0];
		if (file?.type.startsWith('image/')) {
			setThumbnail(file);
		}
	}

	function removeThumbnail() {
		thumbnailFile = null;
		if (thumbnailPreview) {
			URL.revokeObjectURL(thumbnailPreview);
			thumbnailPreview = null;
		}
		if (thumbnailKey) {
			deleteImage(thumbnailKey);
			thumbnailKey = null;
		}
		if (fileInput) fileInput.value = '';
		saveDraft();
	}

	function formatMonth(date: Date): string {
		return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
	}

	function formatDay(date: Date): number {
		return date.getDate();
	}

	function formatWeekday(date: Date): string {
		return date.toLocaleDateString('en-US', { weekday: 'long' });
	}

	function formatFullDate(date: Date): string {
		const options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
		if (date.getFullYear() !== new Date().getFullYear()) {
			options.year = 'numeric';
		}
		return date.toLocaleDateString('en-US', options);
	}

	function formatTime(date: Date): string {
		return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
	}

	let startDate = $derived(startsAt ? new Date(startsAt) : null);
	let endDate = $derived(endsAt ? new Date(endsAt) : null);
	let isSameDay = $derived(
		startDate &&
			endDate &&
			startDate.getFullYear() === endDate.getFullYear() &&
			startDate.getMonth() === endDate.getMonth() &&
			startDate.getDate() === endDate.getDate()
	);

	async function tokensToFacets(tokens: Token[]): Promise<Record<string, unknown>[]> {
		const encoder = new TextEncoder();
		const facets: Record<string, unknown>[] = [];
		let byteOffset = 0;

		for (const token of tokens) {
			const tokenBytes = encoder.encode(token.raw);
			const byteStart = byteOffset;
			const byteEnd = byteOffset + tokenBytes.length;

			if (token.type === 'mention') {
				try {
					const did = await resolveHandle({ handle: token.handle as Handle });
					if (did) {
						facets.push({
							index: { byteStart, byteEnd },
							features: [{ $type: 'app.bsky.richtext.facet#mention', did }]
						});
					}
				} catch {
					// skip unresolvable mentions
				}
			} else if (token.type === 'autolink') {
				facets.push({
					index: { byteStart, byteEnd },
					features: [{ $type: 'app.bsky.richtext.facet#link', uri: token.url }]
				});
			} else if (token.type === 'topic') {
				facets.push({
					index: { byteStart, byteEnd },
					features: [{ $type: 'app.bsky.richtext.facet#tag', tag: token.name }]
				});
			}

			byteOffset = byteEnd;
		}

		return facets;
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
				mode: `community.lexicon.calendar.event#${mode}`,
				status: 'community.lexicon.calendar.event#scheduled',
				startsAt: new Date(startsAt).toISOString(),
				createdAt: new Date().toISOString()
			};

			const trimmedDescription = description.trim();
			if (trimmedDescription) {
				record.description = trimmedDescription;
				const tokens = tokenize(trimmedDescription);
				const facets = await tokensToFacets(tokens);
				if (facets.length > 0) {
					record.facets = facets;
				}
			}
			if (endsAt) {
				record.endsAt = new Date(endsAt).toISOString();
			}
			if (media) {
				record.media = media;
			}
			if (links.length > 0) {
				record.uris = links;
			}

			const response = await user.client.post('com.atproto.repo.createRecord', {
				input: {
					collection: 'community.lexicon.calendar.event',
					repo: user.did,
					record
				}
			});

			if (response.ok) {
				localStorage.removeItem(DRAFT_KEY);
				if (thumbnailKey) deleteImage(thumbnailKey);
				const parts = response.data.uri.split('/');
				const rkey = parts[parts.length - 1];
				const handle =
					user.profile?.handle && user.profile.handle !== 'handle.invalid'
						? user.profile.handle
						: user.did;
				goto(`/${handle}/events/${rkey}`);
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

<div class="bg-base-50 dark:bg-base-950 min-h-screen px-6 py-12 sm:py-12">
	<div class="mx-auto max-w-4xl">
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
			<div class="mb-6 flex items-center gap-3">
				<Badge size="sm">Local draft</Badge>
				{#if hasDraft}
					<button
						type="button"
						onclick={deleteDraft}
						class="text-base-500 dark:text-base-400 cursor-pointer text-xs hover:text-red-500 hover:underline"
					>
						Delete draft
					</button>
				{/if}
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
			>
				<!-- Two-column layout mirroring detail page -->
				<div
					class="grid grid-cols-1 gap-8 md:grid-cols-[14rem_1fr] md:gap-x-10 md:gap-y-6 lg:grid-cols-[16rem_1fr]"
				>
					<!-- Thumbnail (left column) -->
					<!-- svelte-ignore a11y_no_static_element_interactions -->
					<div
						class="order-1 max-w-sm md:order-0 md:col-start-1 md:max-w-none"
						ondragover={onDragOver}
						ondragleave={onDragLeave}
						ondrop={onDrop}
					>
						<input
							bind:this={fileInput}
							type="file"
							accept="image/*"
							onchange={onFileChange}
							class="hidden"
						/>
						{#if thumbnailPreview}
							<div class="relative">
								<button type="button" onclick={() => fileInput?.click()} class="w-full">
									<img
										src={thumbnailPreview}
										alt="Thumbnail preview"
										class="border-base-200 dark:border-base-800 aspect-square w-full cursor-pointer rounded-2xl border object-cover"
									/>
								</button>
								<button
									type="button"
									onclick={removeThumbnail}
									aria-label="Remove thumbnail"
									class="bg-base-900/70 absolute top-2 right-2 flex size-7 items-center justify-center rounded-full text-white hover:bg-red-600"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 20 20"
										fill="currentColor"
										class="size-4"
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
								class="border-base-300 dark:border-base-700 hover:border-base-400 dark:hover:border-base-600 text-base-500 dark:text-base-400 flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed transition-colors {isDragOver
									? 'border-accent-500 bg-accent-50 dark:bg-accent-950 text-accent-500'
									: ''}"
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
								<span class="text-sm">Add image</span>
							</button>
						{/if}
					</div>

					<!-- Right column: event details -->
					<div class="order-2 min-w-0 md:order-0 md:col-start-2 md:row-span-5 md:row-start-1">
						<!-- Name -->
						<input
							type="text"
							bind:value={name}
							required
							placeholder="Event name"
							class="text-base-900 dark:text-base-50 placeholder:text-base-300 dark:placeholder:text-base-700 mb-2 w-full border-0 bg-transparent text-4xl leading-tight font-bold focus:border-0 focus:ring-0 focus:outline-none sm:text-5xl"
						/>

						<!-- Mode toggle -->
						<div class="mb-8">
							<ToggleGroup
								type="single"
								bind:value={
									() => {
										return mode;
									},
									(val) => {
										if (val) mode = val;
									}
								}
								class="w-fit"
							>
								<ToggleGroupItem size="sm" value="inperson">In Person</ToggleGroupItem>
								<ToggleGroupItem size="sm" value="virtual">Virtual</ToggleGroupItem>
								<ToggleGroupItem size="sm" value="hybrid">Hybrid</ToggleGroupItem>
							</ToggleGroup>
						</div>

						<!-- Date row -->
						<div class="mb-4 flex items-center gap-4">
							<div
								class="border-base-200 dark:border-base-700 flex size-12 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border"
							>
								{#if startDate}
									<span
										class="text-base-500 dark:text-base-400 text-[9px] leading-none font-semibold"
									>
										{formatMonth(startDate)}
									</span>
									<span class="text-base-900 dark:text-base-50 text-lg leading-tight font-bold">
										{formatDay(startDate)}
									</span>
								{:else}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="text-base-400 dark:text-base-500 size-5"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
										/>
									</svg>
								{/if}
							</div>
							<div class="flex-1">
								{#if startDate}
									<p class="text-base-900 dark:text-base-50 font-semibold">
										{formatWeekday(startDate)}, {formatFullDate(startDate)}
										{#if endDate && !isSameDay}
											- {formatWeekday(endDate)}, {formatFullDate(endDate)}
										{/if}
									</p>
									<p class="text-base-500 dark:text-base-400 text-sm">
										{formatTime(startDate)}
										{#if endDate && isSameDay}
											- {formatTime(endDate)}
										{/if}
									</p>
								{/if}
								<div class="mt-1 flex flex-wrap gap-3">
									<label class="flex items-center gap-1.5">
										<span class="text-base-500 dark:text-base-400 text-xs">Start</span>
										<input
											type="datetime-local"
											bind:value={startsAt}
											required
											class="text-base-700 dark:text-base-300 bg-transparent text-xs focus:outline-none"
										/>
									</label>
									<label class="flex items-center gap-1.5">
										<span class="text-base-500 dark:text-base-400 text-xs">End</span>
										<input
											type="datetime-local"
											bind:value={endsAt}
											class="text-base-700 dark:text-base-300 bg-transparent text-xs focus:outline-none"
										/>
									</label>
								</div>
							</div>
						</div>

						<!-- About Event -->
						<div class="mt-8 mb-8">
							<p
								class="text-base-500 dark:text-base-400 mb-3 text-xs font-semibold tracking-wider uppercase"
							>
								About
							</p>
							<textarea
								bind:value={description}
								rows={4}
								placeholder="What's this event about? @mentions, #hashtags and links will be detected automatically."
								class="text-base-700 dark:text-base-300 placeholder:text-base-300 dark:placeholder:text-base-700 w-full resize-none border-0 bg-transparent leading-relaxed focus:border-0 focus:ring-0 focus:outline-none"
							></textarea>
						</div>

						{#if error}
							<p class="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
						{/if}

						<Button type="submit" disabled={submitting}>
							{submitting ? 'Creating...' : 'Create Event'}
						</Button>
					</div>

					<!-- Hosted By -->
					<div class="order-3 md:order-0 md:col-start-1">
						<p
							class="text-base-500 dark:text-base-400 mb-3 text-xs font-semibold tracking-wider uppercase"
						>
							Hosted By
						</p>
						<div class="flex items-center gap-2.5">
							<FoxAvatar src={user.profile?.avatar} alt={hostName} class="size-8 shrink-0" />
							<span class="text-base-900 dark:text-base-100 truncate text-sm font-medium">
								{hostName}
							</span>
						</div>
					</div>

					<!-- Links -->
					<div class="order-4 md:order-0 md:col-start-1">
						<p
							class="text-base-500 dark:text-base-400 mb-4 text-xs font-semibold tracking-wider uppercase"
						>
							Links
						</p>
						<div class="space-y-3">
							{#each links as link, i (i)}
								<div class="group flex items-center gap-1.5">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="text-base-700 dark:text-base-300 size-3.5 shrink-0"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
										/>
									</svg>
									<span class="text-base-700 dark:text-base-300 truncate text-sm">
										{link.name || link.uri.replace(/^https?:\/\//, '')}
									</span>
									<button
										type="button"
										onclick={() => removeLink(i)}
										class="text-base-400 ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-500"
										aria-label="Remove link"
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
							{/each}
						</div>

						<div class="relative mt-3">
							<button
								type="button"
								onclick={() => (showLinkPopup = !showLinkPopup)}
								class="text-base-500 dark:text-base-400 hover:text-base-700 dark:hover:text-base-200 flex items-center gap-1.5 text-sm transition-colors"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
									class="size-4"
								>
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
								</svg>
								Add link
							</button>

							{#if showLinkPopup}
								<div
									class="border-base-200 dark:border-base-700 bg-base-50 dark:bg-base-900 absolute top-full left-0 z-10 mt-2 w-64 rounded-xl border p-3 shadow-lg"
								>
									<input
										type="url"
										bind:value={newLinkUri}
										placeholder="https://..."
										class="border-base-300 dark:border-base-700 bg-base-100 dark:bg-base-800 text-base-900 dark:text-base-100 placeholder:text-base-400 dark:placeholder:text-base-600 mb-2 w-full rounded-lg border px-2.5 py-1.5 text-sm focus:outline-none"
									/>
									<input
										type="text"
										bind:value={newLinkName}
										placeholder="Label (optional)"
										class="border-base-300 dark:border-base-700 bg-base-100 dark:bg-base-800 text-base-900 dark:text-base-100 placeholder:text-base-400 dark:placeholder:text-base-600 mb-3 w-full rounded-lg border px-2.5 py-1.5 text-sm focus:outline-none"
									/>
									<div class="flex justify-end gap-2">
										<button
											type="button"
											onclick={() => (showLinkPopup = false)}
											class="text-base-500 dark:text-base-400 text-xs hover:underline"
										>
											Cancel
										</button>
										<button
											type="button"
											onclick={addLink}
											disabled={!newLinkUri.trim()}
											class="bg-base-900 dark:bg-base-100 text-base-50 dark:text-base-900 disabled:bg-base-300 dark:disabled:bg-base-700 rounded-lg px-3 py-1 text-xs font-medium disabled:cursor-not-allowed"
										>
											Add
										</button>
									</div>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</form>
		{/if}
	</div>
</div>
