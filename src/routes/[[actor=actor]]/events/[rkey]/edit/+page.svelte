<script lang="ts">
	import { user } from '$lib/atproto/auth.svelte';
	import { loginModalState } from '$lib/atproto/UI/LoginModal.svelte';
	import { uploadBlob, putRecord, deleteRecord, resolveHandle } from '$lib/atproto/methods';
	import { getCDNImageBlobUrl } from '$lib/atproto';
	import { compressImage } from '$lib/atproto/image-helper';
	import { validateLink } from '$lib/helper';
	import {
		Avatar as FoxAvatar,
		Button,
		PopoverRoot,
		PopoverTrigger,
		PopoverContent,
		ToggleGroup,
		ToggleGroupItem,
		Input
	} from '@foxui/core';
	import { goto } from '$app/navigation';
	import { tokenize, type Token } from '@atcute/bluesky-richtext-parser';
	import type { Handle } from '@atcute/lexicons';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { putImage, getImage, deleteImage } from '$lib/components/image-store';
	import Modal from '$lib/components/modal/Modal.svelte';
	import Avatar from 'svelte-boring-avatars';
	import DateTimePicker from '$lib/components/DateTimePicker.svelte';

	let { data } = $props();

	let rkey: string = $derived(data.rkey);
	let isNew = $derived(data.eventData === null);
	let DRAFT_KEY = $derived(`blento-event-edit-${rkey}`);

	type EventMode = 'inperson' | 'virtual' | 'hybrid';

	interface EventLocation {
		street?: string;
		locality?: string;
		region?: string;
		country?: string;
	}

	interface EventDraft {
		name: string;
		description: string;
		startsAt: string;
		endsAt: string;
		links: Array<{ uri: string; name: string }>;
		mode?: EventMode;
		thumbnailKey?: string;
		thumbnailChanged?: boolean;
		location?: EventLocation | null;
		locationChanged?: boolean;
	}

	let thumbnailKey: string | null = $state(null);
	let thumbnailChanged = $state(false);

	let name = $state('');
	let description = $state('');
	let startsAt = $state('');
	let endsAt = $state('');
	let mode: EventMode = $state('inperson');
	let thumbnailFile: File | null = $state(null);
	let thumbnailPreview: string | null = $state(null);
	let submitting = $state(false);
	let error: string | null = $state(null);
	let titleEl: HTMLTextAreaElement | undefined = $state(undefined);

	let location: EventLocation | null = $state(null);
	let locationChanged = $state(false);
	let showLocationModal = $state(false);
	let locationSearch = $state('');
	let locationSearching = $state(false);
	let locationError = $state('');
	let locationResult: { displayName: string; location: EventLocation } | null = $state(null);

	let links: Array<{ uri: string; name: string }> = $state([]);
	let editingDates = $state(false);
	let showLinkPopup = $state(false);
	let newLinkUri = $state('');
	let newLinkName = $state('');
	let linkError = $state('');

	let draftLoaded = $state(false);

	function isoToDatetimeLocal(iso: string): string {
		const date = new Date(iso);
		const pad = (n: number) => n.toString().padStart(2, '0');
		return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
	}

	function stripModePrefix(modeStr: string): EventMode {
		const stripped = modeStr.replace('community.lexicon.calendar.event#', '');
		if (stripped === 'virtual' || stripped === 'hybrid' || stripped === 'inperson') return stripped;
		return 'inperson';
	}

	function populateLocationFromEventData() {
		const eventData = data.eventData;
		if (!eventData) return;
		if (eventData.locations && eventData.locations.length > 0) {
			const loc = eventData.locations.find((v) => v.$type === 'community.lexicon.location.address');
			if (loc) {
				const flat = loc as Record<string, unknown>;
				const nested = loc.address;
				const street = (flat.street as string) || undefined;
				const locality = (flat.locality as string) || nested?.locality;
				const region = (flat.region as string) || nested?.region;
				const country = (flat.country as string) || nested?.country;
				location = {
					...(street && { street }),
					...(locality && { locality }),
					...(region && { region }),
					...(country && { country })
				};
			}
		}
		locationChanged = false;
	}

	function populateThumbnailFromEventData() {
		const eventData = data.eventData;
		if (!eventData) return;
		if (eventData.media && eventData.media.length > 0) {
			const media = eventData.media.find((m) => m.role === 'thumbnail');
			if (media?.content) {
				const url = getCDNImageBlobUrl({ did: data.did, blob: media.content, type: 'jpeg' });
				if (url) {
					thumbnailPreview = url;
					thumbnailChanged = false;
				}
			}
		}
	}

	function populateFromEventData() {
		const eventData = data.eventData;
		if (!eventData) return;
		name = eventData.name || '';
		description = eventData.description || '';
		startsAt = eventData.startsAt ? isoToDatetimeLocal(eventData.startsAt) : '';
		endsAt = eventData.endsAt ? isoToDatetimeLocal(eventData.endsAt) : '';
		mode = eventData.mode ? stripModePrefix(eventData.mode) : 'inperson';
		links = eventData.uris ? eventData.uris.map((l) => ({ uri: l.uri, name: l.name || '' })) : [];
		populateLocationFromEventData();
		populateThumbnailFromEventData();
	}

	onMount(async () => {
		// Migrate old creation draft if this is a new event
		if (isNew) {
			const oldDraft = localStorage.getItem('blento-event-draft');
			if (oldDraft && !localStorage.getItem(DRAFT_KEY)) {
				localStorage.setItem(DRAFT_KEY, oldDraft);
				localStorage.removeItem('blento-event-draft');
			}
		}

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
				locationChanged = draft.locationChanged || false;
				if (draft.locationChanged) {
					location = draft.location || null;
				} else if (!isNew) {
					// For edits without location changes, load from event data
					populateLocationFromEventData();
				}
				thumbnailChanged = draft.thumbnailChanged || false;

				if (draft.thumbnailKey) {
					const img = await getImage(draft.thumbnailKey);
					if (img) {
						thumbnailKey = draft.thumbnailKey;
						thumbnailFile = new File([img.blob], img.name, { type: img.blob.type });
						thumbnailPreview = URL.createObjectURL(img.blob);
						thumbnailChanged = true;
					}
				} else if (!thumbnailChanged && !isNew) {
					// No new thumbnail in draft, show existing one from event data
					populateThumbnailFromEventData();
				}
			} catch {
				localStorage.removeItem(DRAFT_KEY);
				if (!isNew) populateFromEventData();
			}
		} else if (!isNew) {
			populateFromEventData();
		}
		draftLoaded = true;
		if (!startsAt) editingDates = true;
		titleEl?.focus();
	});

	let saveDraftTimeout: ReturnType<typeof setTimeout> | undefined;

	function saveDraft() {
		if (!draftLoaded || !browser) return;
		clearTimeout(saveDraftTimeout);
		saveDraftTimeout = setTimeout(() => {
			const draft: EventDraft = {
				name,
				description,
				startsAt,
				endsAt,
				links,
				mode,
				thumbnailChanged,
				locationChanged
			};
			if (locationChanged) draft.location = location;
			if (thumbnailKey) draft.thumbnailKey = thumbnailKey;
			localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
		}, 500);
	}

	$effect(() => {
		// track all draft fields by reading them
		void [
			name,
			description,
			startsAt,
			endsAt,
			mode,
			JSON.stringify(links),
			JSON.stringify(location)
		];
		saveDraft();
	});

	async function searchLocation() {
		const q = locationSearch.trim();
		if (!q) return;
		locationError = '';
		locationSearching = true;
		locationResult = null;

		try {
			const response = await fetch('/api/geocoding?q=' + encodeURIComponent(q));
			if (!response.ok) throw new Error('response not ok');
			const data = await response.json();
			if (!data || data.error) throw new Error('no results');

			const addr = data.address || {};
			const road = addr.road || '';
			const houseNumber = addr.house_number || '';
			const street = road ? (houseNumber ? `${road} ${houseNumber}` : road) : '';
			const locality =
				addr.city || addr.town || addr.village || addr.municipality || addr.hamlet || '';
			const region = addr.state || addr.county || '';
			const country = addr.country || '';

			locationResult = {
				displayName: data.display_name || q,
				location: {
					...(street && { street }),
					...(locality && { locality }),
					...(region && { region }),
					...(country && { country })
				}
			};
		} catch {
			locationError = "Couldn't find that location.";
		} finally {
			locationSearching = false;
		}
	}

	function confirmLocation() {
		if (locationResult) {
			location = locationResult.location;
			locationChanged = true;
		}
		showLocationModal = false;
		locationSearch = '';
		locationResult = null;
		locationError = '';
	}

	function removeLocation() {
		location = null;
		locationChanged = true;
	}

	function getLocationDisplayString(loc: EventLocation): string {
		return [loc.street, loc.locality, loc.region, loc.country].filter(Boolean).join(', ');
	}

	function addLink() {
		const raw = newLinkUri.trim();
		if (!raw) return;
		const uri = validateLink(raw);
		if (!uri) {
			linkError = 'Please enter a valid URL';
			return;
		}
		links.push({ uri, name: newLinkName.trim() });
		newLinkUri = '';
		newLinkName = '';
		linkError = '';
		showLinkPopup = false;
	}

	function removeLink(index: number) {
		links.splice(index, 1);
	}

	let fileInput: HTMLInputElement | undefined = $state();

	let hostName = $derived(user.profile?.displayName || user.profile?.handle || user.did || '');

	async function setThumbnail(file: File) {
		thumbnailFile = file;
		thumbnailChanged = true;
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
		thumbnailChanged = true;
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

	// Auto-adjust end date if start moves past it
	$effect(() => {
		if (startsAt && endsAt) {
			const s = new Date(startsAt);
			const e = new Date(endsAt);
			if (s >= e) {
				const adjusted = new Date(s);
				adjusted.setHours(adjusted.getHours() + 1);
				endsAt = isoToDatetimeLocal(adjusted.toISOString());
			}
		}
	});

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

			if (isNew || thumbnailChanged) {
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
				// If changed/new but no thumbnailFile, media stays undefined (thumbnail removed/absent)
			} else {
				// Thumbnail not changed — reuse original media from eventData
				if (data.eventData?.media && data.eventData.media.length > 0) {
					media = data.eventData.media as Array<Record<string, unknown>>;
				}
			}

			const createdAt = isNew
				? new Date().toISOString()
				: ((data.eventData as Record<string, unknown>)?.createdAt as string) ||
					new Date().toISOString();

			const record: Record<string, unknown> = {
				$type: 'community.lexicon.calendar.event',
				name: name.trim(),
				mode: `community.lexicon.calendar.event#${mode}`,
				status: 'community.lexicon.calendar.event#scheduled',
				startsAt: new Date(startsAt).toISOString(),
				createdAt
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
			if (isNew || locationChanged) {
				if (location) {
					record.locations = [
						{
							$type: 'community.lexicon.location.address',
							...location
						}
					];
				}
				// If changed/new but no location, locations stays undefined (removed/absent)
			} else if (data.eventData?.locations && data.eventData.locations.length > 0) {
				record.locations = data.eventData.locations;
			}

			const response = await putRecord({
				collection: 'community.lexicon.calendar.event',
				rkey,
				record
			});

			if (response.ok) {
				localStorage.removeItem(DRAFT_KEY);
				if (thumbnailKey) deleteImage(thumbnailKey);
				const handle =
					user.profile?.handle && user.profile.handle !== 'handle.invalid'
						? user.profile.handle
						: user.did;
				goto(`/${handle}/events/${rkey}`);
			} else {
				error = `Failed to ${isNew ? 'create' : 'save'} event. Please try again.`;
			}
		} catch (e) {
			console.error(`Failed to ${isNew ? 'create' : 'save'} event:`, e);
			error = `Failed to ${isNew ? 'create' : 'save'} event. Please try again.`;
		} finally {
			submitting = false;
		}
	}

	let showDeleteConfirm = $state(false);
	let deleting = $state(false);

	async function handleDelete() {
		deleting = true;
		try {
			await deleteRecord({
				collection: 'community.lexicon.calendar.event',
				rkey
			});
			localStorage.removeItem(DRAFT_KEY);
			if (thumbnailKey) deleteImage(thumbnailKey);
			const handle =
				user.profile?.handle && user.profile.handle !== 'handle.invalid'
					? user.profile.handle
					: user.did;
			goto(`/${handle}/events`);
		} catch (e) {
			console.error('Failed to delete event:', e);
			error = 'Failed to delete event. Please try again.';
		} finally {
			deleting = false;
			showDeleteConfirm = false;
		}
	}
</script>

<svelte:head>
	<title>{isNew ? 'Create Event' : 'Edit Event'}</title>
</svelte:head>

<div class="min-h-screen px-6 py-12 sm:py-12">
	<div class="mx-auto max-w-3xl">
		{#if user.isInitializing}
			<div class="flex items-center gap-3">
				<div class="bg-base-300 dark:bg-base-700 size-5 animate-pulse rounded-full"></div>
				<div class="bg-base-300 dark:bg-base-700 h-4 w-48 animate-pulse rounded"></div>
			</div>
		{:else if !user.isLoggedIn}
			<div
				class="border-base-200 dark:border-base-800 bg-base-100 dark:bg-base-900/50 rounded-2xl border p-8 text-center"
			>
				<p class="text-base-600 dark:text-base-400 mb-4">
					Log in to {isNew ? 'create an event' : 'edit this event'}.
				</p>
				<Button onclick={() => loginModalState.show()}>Log in</Button>
			</div>
		{:else}
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
						<div class="group relative">
							{#if thumbnailPreview}
								<img
									src={thumbnailPreview}
									alt="Thumbnail preview"
									class="border-base-200 dark:border-base-800 aspect-square w-full rounded-2xl border object-cover"
								/>
							{:else}
								<div
									class="bg-base-100 dark:bg-base-900 aspect-square w-full overflow-hidden rounded-2xl [&>svg]:h-full [&>svg]:w-full"
								>
									<Avatar
										size={400}
										name={rkey}
										variant="marble"
										colors={['#92A1C6', '#146A7C', '#F0AB3D', '#C271B4', '#C20D90']}
										square
									/>
								</div>
							{/if}
							<!-- Upload overlay on hover -->
							<button
								type="button"
								onclick={() => fileInput?.click()}
								class="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl bg-black/0 text-white/0 transition-colors group-hover:bg-black/40 group-hover:text-white/90 {isDragOver
									? 'bg-black/40 text-white/90'
									: ''}"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									fill="none"
									viewBox="0 0 24 24"
									stroke-width="1.5"
									stroke="currentColor"
									class="size-6"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z"
									/>
								</svg>
								<span class="text-sm font-medium">Upload thumbnail</span>
							</button>
							{#if thumbnailPreview}
								<Button
									variant="ghost"
									size="iconSm"
									onclick={removeThumbnail}
									class="bg-base-900/70 absolute top-2 right-2 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-600"
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
								</Button>
							{/if}
						</div>
					</div>

					<!-- Right column: event details -->
					<div class="order-2 min-w-0 md:order-0 md:col-start-2 md:row-span-5 md:row-start-1">
						<!-- Name + Save button -->
						<div class="mb-2 flex items-start justify-between gap-4">
							<textarea
								bind:this={titleEl}
								bind:value={name}
								required
								placeholder="Event name"
								rows={1}
								class="text-base-900 dark:text-base-50 placeholder:text-base-500 dark:placeholder:text-base-500 w-full min-w-0 resize-none border-0 bg-transparent px-0 text-4xl leading-tight font-bold focus:border-0 focus:ring-0 focus:outline-none sm:text-5xl"
								style="field-sizing: content;"
							></textarea>
							<Button
								type="submit"
								size="sm"
								class="shrink-0"
								disabled={submitting || !name.trim() || !startsAt}
							>
								{submitting ? (isNew ? 'Creating...' : 'Saving...') : isNew ? 'Create' : 'Save'}
							</Button>
						</div>

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
						<div class="mb-4 flex items-start gap-4">
							<div
								class="border-base-200 dark:border-base-700 bg-base-100 dark:bg-base-950/30 flex size-12 shrink-0 flex-col items-center justify-center overflow-hidden rounded-xl border"
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
										class="text-base-900 dark:text-base-200 size-5"
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
								{#if startDate && !editingDates}
									<!-- Display mode: show formatted date, click to edit -->
									<div class="flex items-start gap-2">
										<button
											type="button"
											onclick={() => (editingDates = true)}
											class="cursor-pointer text-left"
										>
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
										</button>
										<Button variant="ghost" size="iconSm" onclick={() => (editingDates = true)}>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
												class="size-3.5"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
												/>
											</svg>
										</Button>
									</div>
								{:else}
									<!-- Edit mode: show pickers -->
									<div class="flex flex-col gap-2">
										<div class="flex items-center gap-2">
											{#if endsAt}
												<span class="text-base-500 dark:text-base-400 w-9 text-xs">Start</span>
											{/if}
											<DateTimePicker bind:value={startsAt} required />
										</div>
										{#if endsAt}
											<div class="flex items-center gap-2">
												<span class="text-base-500 dark:text-base-400 w-9 text-xs">End</span>
												<DateTimePicker bind:value={endsAt} minValue={startsAt} />
												<Button variant="ghost" size="iconSm" onclick={() => (endsAt = '')}>
													<svg
														xmlns="http://www.w3.org/2000/svg"
														fill="none"
														viewBox="0 0 24 24"
														stroke-width="1.5"
														stroke="currentColor"
														class="size-3.5"
													>
														<path
															stroke-linecap="round"
															stroke-linejoin="round"
															d="M6 18 18 6M6 6l12 12"
														/>
													</svg>
												</Button>
											</div>
										{:else}
											<Button
												variant="ghost"
												size="sm"
												class="w-fit"
												onclick={() => {
													if (startsAt) {
														const d = new Date(startsAt);
														d.setHours(d.getHours() + 1);
														endsAt = isoToDatetimeLocal(d.toISOString());
													} else {
														endsAt = '';
													}
												}}
											>
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke-width="1.5"
													stroke="currentColor"
													class="size-3.5"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="M12 4.5v15m7.5-7.5h-15"
													/>
												</svg>
												Add end date
											</Button>
										{/if}
										{#if startDate}
											<Button size="sm" onclick={() => (editingDates = false)} class="mt-1 w-fit">
												<svg
													xmlns="http://www.w3.org/2000/svg"
													fill="none"
													viewBox="0 0 24 24"
													stroke-width="2"
													stroke="currentColor"
													class="size-3.5"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														d="m4.5 12.75 6 6 9-13.5"
													/>
												</svg>
												Done
											</Button>
										{/if}
									</div>
								{/if}
							</div>
						</div>

						<!-- Location row -->
						{#if location}
							<div class="mb-6 flex items-center gap-4">
								<div
									class="border-base-200 dark:border-base-700 bg-base-100 dark:bg-base-950/30 flex size-12 shrink-0 items-center justify-center rounded-xl border"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="text-base-900 dark:text-base-200 size-5"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
										/>
									</svg>
								</div>
								<p class="text-base-900 dark:text-base-50 flex-1 font-semibold">
									{getLocationDisplayString(location)}
								</p>
								<Button variant="ghost" size="iconSm" onclick={removeLocation} class="shrink-0">
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
								</Button>
							</div>
						{:else}
							<div class="mb-6">
								<Button variant="ghost" onclick={() => (showLocationModal = true)}>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										stroke-width="1.5"
										stroke="currentColor"
										class="size-4"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
										/>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
										/>
									</svg>
									Add location
								</Button>
							</div>
						{/if}

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
								class="text-base-700 dark:text-base-300 placeholder:text-base-500 dark:placeholder:text-base-500 w-full resize-none border-0 bg-transparent px-0 leading-relaxed focus:border-0 focus:ring-0 focus:outline-none"
								style="field-sizing: content;"
							></textarea>
						</div>

						{#if error}
							<p class="mb-4 text-sm text-red-600 dark:text-red-400">{error}</p>
						{/if}

						<Button type="submit" disabled={submitting || !name.trim() || !startsAt}>
							{submitting
								? isNew
									? 'Creating...'
									: 'Saving...'
								: isNew
									? 'Create Event'
									: 'Save Changes'}
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
									<Button
										variant="ghost"
										size="iconSm"
										onclick={() => removeLink(i)}
										class="ml-auto shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
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
									</Button>
								</div>
							{/each}
						</div>

						<div class="mt-3">
							<PopoverRoot bind:open={showLinkPopup}>
								<PopoverTrigger>
									<Button size="sm">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
											stroke-width="1.5"
											stroke="currentColor"
											class="size-4"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												d="M12 4.5v15m7.5-7.5h-15"
											/>
										</svg>

										Add link
									</Button>
								</PopoverTrigger>
								<PopoverContent side="bottom" sideOffset={8} class="w-64 p-3">
									<Input
										type="url"
										bind:value={newLinkUri}
										placeholder="https://..."
										variant="secondary"
										class="mb-2"
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												addLink();
											}
										}}
									/>
									<Input
										type="text"
										bind:value={newLinkName}
										placeholder="Label (optional)"
										variant="secondary"
										class="mb-2"
										onkeydown={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault();
												addLink();
											}
										}}
									/>
									{#if linkError}
										<p class="mb-2 text-xs text-red-500">{linkError}</p>
									{/if}
									<div class="flex justify-end gap-2">
										<Button
											variant="ghost"
											size="sm"
											onclick={() => {
												showLinkPopup = false;
												linkError = '';
												newLinkUri = '';
												newLinkName = '';
											}}
										>
											Cancel
										</Button>
										<Button onclick={addLink} size="sm" disabled={!newLinkUri.trim()}>Add</Button>
									</div>
								</PopoverContent>
							</PopoverRoot>
						</div>
					</div>
				</div>

				{#if !isNew}
					<div class="border-base-200 dark:border-base-800 mt-12 border-t pt-8">
						{#if showDeleteConfirm}
							<div class="flex items-center gap-3">
								<p class="text-sm text-red-600 dark:text-red-400">
									Are you sure? This cannot be undone.
								</p>
								<Button
									variant="secondary"
									size="sm"
									onclick={() => (showDeleteConfirm = false)}
									disabled={deleting}
								>
									Cancel
								</Button>
								<Button
									size="sm"
									onclick={handleDelete}
									disabled={deleting}
									variant="red"
								>
									{deleting ? 'Deleting...' : 'Delete'}
								</Button>
							</div>
						{:else}
							<Button
								variant="red"
								onclick={() => (showDeleteConfirm = true)}
							>
								Delete event
							</Button>
						{/if}
					</div>
				{/if}
			</form>
		{/if}
	</div>
</div>

<!-- Location modal -->
<Modal bind:open={showLocationModal}>
	<p class="text-base-900 dark:text-base-50 text-lg font-semibold">Add location</p>
	<form
		onsubmit={(e) => {
			e.preventDefault();
			searchLocation();
		}}
		class="mt-2"
	>
		<div class="flex gap-2">
			<Input type="text" class="flex-1" bind:value={locationSearch} />
			<Button type="submit" disabled={locationSearching || !locationSearch.trim()}>
				{locationSearching ? 'Searching...' : 'Search'}
			</Button>
		</div>
	</form>

	{#if locationError}
		<p class="mt-3 text-sm text-red-600 dark:text-red-400">{locationError}</p>
	{/if}

	{#if locationResult}
		<div
			class="border-base-200 dark:border-base-700 bg-base-50 dark:bg-base-900 mt-4 overflow-hidden rounded-xl border p-4"
		>
			<div class="flex items-start gap-3">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="text-base-500 mt-0.5 size-5 shrink-0"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
					/>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
					/>
				</svg>
				<div class="min-w-0 flex-1">
					<p class="text-base-900 dark:text-base-50 font-medium">
						{getLocationDisplayString(locationResult.location)}
					</p>
					<p class="text-base-500 dark:text-base-400 mt-0.5 truncate text-xs">
						{locationResult.displayName}
					</p>
				</div>
			</div>
			<div class="mt-4 flex justify-end">
				<Button onclick={confirmLocation}>Use this location</Button>
			</div>
		</div>
	{/if}

	<p class="text-base-400 dark:text-base-500 mt-4 text-xs">
		Geocoding by <a
			href="https://nominatim.openstreetmap.org/"
			class="hover:text-base-600 dark:hover:text-base-400 underline"
			target="_blank">Nominatim</a
		>
		/ &copy;
		<a
			href="https://www.openstreetmap.org/copyright"
			class="hover:text-base-600 dark:hover:text-base-400 underline"
			target="_blank">OpenStreetMap contributors</a
		>
	</p>
</Modal>
