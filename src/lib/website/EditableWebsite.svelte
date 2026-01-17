<script lang="ts">
	import { client, login } from '$lib/oauth/auth.svelte.js';

	import { Navbar, Button, toast, Toaster, Toggle, Sidebar, Popover, Input } from '@foxui/core';
	import { BlueskyLogin } from '@foxui/social';

	import { COLUMNS, margin, mobileMargin } from '$lib';
	import {
		clamp,
		compactItems,
		createEmptyCard,
		fixCollisions,
		getHideProfile,
		getName,
		isTyping,
		savePage,
		scrollToItem,
		setPositionOfNewItem,
		validateLink
	} from '../helper';
	import Profile from './Profile.svelte';
	import type { Item, WebsiteData } from '../types';
	import { innerWidth } from 'svelte/reactivity/window';
	import EditingCard from '../cards/Card/EditingCard.svelte';
	import { AllCardDefinitions, CardDefinitionsByType } from '../cards';
	import { tick, type Component } from 'svelte';
	import type { CreationModalComponentProps } from '../cards/types';
	import { dev } from '$app/environment';
	import { setIsMobile } from './context';
	import BaseEditingCard from '../cards/BaseCard/BaseEditingCard.svelte';
	import Context from './Context.svelte';
	import Settings from './Settings.svelte';
	import Head from './Head.svelte';
	import { compressImage } from '../helper';

	let {
		data
	}: {
		data: WebsiteData;
	} = $props();

	let imageInputRef: HTMLInputElement | undefined = $state();
	let imageDragOver = $state(false);
	let imageDragPosition: { x: number; y: number } | null = $state(null);

	// svelte-ignore state_referenced_locally
	let items: Item[] = $state(data.cards);

	// svelte-ignore state_referenced_locally
	let publication = $state(JSON.stringify(data.publication));

	let container: HTMLDivElement | undefined = $state();

	let activeDragElement: {
		element: HTMLDivElement | null;
		item: Item | null;
		w: number;
		h: number;
		x: number;
		y: number;
		mouseDeltaX: number;
		mouseDeltaY: number;
		// For hysteresis - track last decision to prevent flickering
		lastTargetId: string | null;
		lastPlacement: 'above' | 'below' | null;
		// Store original positions to reset from during drag
		originalPositions: Map<string, { x: number; y: number; mobileX: number; mobileY: number }>;
	} = $state({
		element: null,
		item: null,
		w: 0,
		h: 0,
		x: -1,
		y: -1,
		mouseDeltaX: 0,
		mouseDeltaY: 0,
		lastTargetId: null,
		lastPlacement: null,
		originalPositions: new Map()
	});

	let showingMobileView = $state(false);
	let isMobile = $derived(showingMobileView || (innerWidth.current ?? 1000) < 1024);

	setIsMobile(() => isMobile);

	const getY = (item: Item) => (isMobile ? (item.mobileY ?? item.y) : item.y);
	const getH = (item: Item) => (isMobile ? (item.mobileH ?? item.h) : item.h);

	let maxHeight = $derived(items.reduce((max, item) => Math.max(max, getY(item) + getH(item)), 0));

	function newCard(type: string = 'link', cardData?: any) {
		// close sidebar if open
		const popover = document.getElementById('mobile-menu');
		if (popover) {
			popover.hidePopover();
		}

		let item = createEmptyCard(data.page);
		item.cardType = type;

		item.cardData = cardData ?? {};

		const cardDef = CardDefinitionsByType[type];
		cardDef?.createNew?.(item);

		newItem.item = item;

		if (cardDef?.creationModalComponent) {
			newItem.modal = cardDef.creationModalComponent;
		} else {
			saveNewItem();
		}
	}

	async function saveNewItem() {
		if (!newItem.item) return;
		const item = newItem.item;

		setPositionOfNewItem(item, items);

		items = [...items, item];

		newItem = {};

		await tick();

		scrollToItem(item, isMobile, container);
	}

	let isSaving = $state(false);

	let newItem: { modal?: Component<CreationModalComponentProps>; item?: Item } = $state({});

	async function save() {
		isSaving = true;

		await savePage(data, items, publication);

		publication = JSON.stringify(data.publication);
	}

	const sidebarItems = AllCardDefinitions.filter(
		(cardDef) => cardDef.sidebarComponent || cardDef.sidebarButtonText
	);

	let showSettings = $state(false);

	let debugPoint = $state({ x: 0, y: 0 });

	let linkPopoverOpen = $state(false);

	function getDragXY(
		e: DragEvent & {
			currentTarget: EventTarget & HTMLDivElement;
		}
	):
		| { x: number; y: number; swapWithId: string | null; placement: 'above' | 'below' | null }
		| undefined {
		if (!container || !activeDragElement.item) return;

		// x, y represent the top-left corner of the dragged card
		const x = e.clientX + activeDragElement.mouseDeltaX;
		const y = e.clientY + activeDragElement.mouseDeltaY;

		const rect = container.getBoundingClientRect();
		const currentMargin = isMobile ? mobileMargin : margin;
		const cellSize = (rect.width - currentMargin * 2) / COLUMNS;

		// Get card dimensions based on current view mode
		const cardW = isMobile
			? (activeDragElement.item?.mobileW ?? activeDragElement.w)
			: activeDragElement.w;
		const cardH = isMobile
			? (activeDragElement.item?.mobileH ?? activeDragElement.h)
			: activeDragElement.h;

		// Get dragged card's original position
		const draggedOrigPos = activeDragElement.originalPositions.get(activeDragElement.item.id);
		const draggedOrigX = draggedOrigPos
			? isMobile
				? draggedOrigPos.mobileX
				: draggedOrigPos.x
			: 0;
		const draggedOrigY = draggedOrigPos
			? isMobile
				? draggedOrigPos.mobileY
				: draggedOrigPos.y
			: 0;

		// Calculate raw grid position based on top-left of dragged card
		let gridX = clamp(Math.round((x - rect.left - currentMargin) / cellSize), 0, COLUMNS - cardW);
		gridX = Math.floor(gridX / 2) * 2;

		let gridY = Math.max(Math.round((y - rect.top - currentMargin) / cellSize), 0);

		if (isMobile) {
			gridX = Math.floor(gridX / 2) * 2;
			gridY = Math.floor(gridY / 2) * 2;
		}

		// Find if we're hovering over another card (using ORIGINAL positions)
		const centerGridY = gridY + cardH / 2;
		const centerGridX = gridX + cardW / 2;

		let swapWithId: string | null = null;
		let placement: 'above' | 'below' | null = null;

		for (const other of items) {
			if (other === activeDragElement.item) continue;

			// Use original positions for hit testing
			const origPos = activeDragElement.originalPositions.get(other.id);
			if (!origPos) continue;

			const otherX = isMobile ? origPos.mobileX : origPos.x;
			const otherY = isMobile ? origPos.mobileY : origPos.y;
			const otherW = isMobile ? other.mobileW : other.w;
			const otherH = isMobile ? other.mobileH : other.h;

			// Check if dragged card's center point is within this card's original bounds
			if (
				centerGridX >= otherX &&
				centerGridX < otherX + otherW &&
				centerGridY >= otherY &&
				centerGridY < otherY + otherH
			) {
				// Check if this is a swap situation:
				// Cards have the same dimensions and are on the same row
				const canSwap = cardW === otherW && cardH === otherH && draggedOrigY === otherY;

				if (canSwap) {
					// Swap positions
					swapWithId = other.id;
					gridX = otherX;
					gridY = otherY;
					placement = null;

					activeDragElement.lastTargetId = other.id;
					activeDragElement.lastPlacement = null;
				} else {
					// Vertical placement (above/below)
					// Detect drag direction: if dragging up, always place above
					const isDraggingUp = gridY < draggedOrigY;

					if (isDraggingUp) {
						// When dragging up, always place above
						placement = 'above';
					} else {
						// When dragging down, use top/bottom half logic
						const midpointY = otherY + otherH / 2;
						const hysteresis = 0.3;

						if (activeDragElement.lastTargetId === other.id && activeDragElement.lastPlacement) {
							if (activeDragElement.lastPlacement === 'above') {
								placement = centerGridY > midpointY + hysteresis ? 'below' : 'above';
							} else {
								placement = centerGridY < midpointY - hysteresis ? 'above' : 'below';
							}
						} else {
							placement = centerGridY < midpointY ? 'above' : 'below';
						}
					}

					activeDragElement.lastTargetId = other.id;
					activeDragElement.lastPlacement = placement;

					if (placement === 'above') {
						gridY = otherY;
					} else {
						gridY = otherY + otherH;
					}
				}
				break;
			}
		}

		// If we're not over any card, clear the tracking
		if (!swapWithId && !placement) {
			activeDragElement.lastTargetId = null;
			activeDragElement.lastPlacement = null;
		}

		debugPoint.x = x - rect.left;
		debugPoint.y = y - rect.top + currentMargin;

		return { x: gridX, y: gridY, swapWithId, placement };
	}

	let linkValue = $state('');

	function addLink(url: string) {
		let link = validateLink(url);
		if (!link) {
			toast.error('invalid link');
			return;
		}
		let item = createEmptyCard(data.page);

		for (const cardDef of AllCardDefinitions.toSorted(
			(a, b) => (b.urlHandlerPriority ?? 0) - (a.urlHandlerPriority ?? 0)
		)) {
			if (cardDef.onUrlHandler?.(link, item)) {
				item.cardType = cardDef.type;

				newItem.item = item;
				saveNewItem();
				break;
			}
		}

		if (linkValue === url) {
			linkValue = '';
			linkPopoverOpen = false;
		}
	}

	async function processImageFile(file: File, gridX?: number, gridY?: number) {
		const compressedFile = await compressImage(file);
		const objectUrl = URL.createObjectURL(compressedFile);

		let item = createEmptyCard(data.page);

		item.cardType = 'image';
		item.cardData = {
			blob: compressedFile,
			objectUrl
		};

		// If grid position is provided
		if (gridX !== undefined && gridY !== undefined) {
			if (isMobile) {
				item.mobileX = gridX;
				item.mobileY = gridY;
			} else {
				item.x = gridX;
				item.y = gridY;
			}

			items = [...items, item];
			fixCollisions(items, item, isMobile);
		} else {
			setPositionOfNewItem(item, items);
			items = [...items, item];
		}

		await tick();

		scrollToItem(item, isMobile, container);
	}

	function handleImageDragOver(event: DragEvent) {
		const dt = event.dataTransfer;
		if (!dt) return;

		let hasImage = false;
		if (dt.items) {
			for (let i = 0; i < dt.items.length; i++) {
				const item = dt.items[i];
				if (item && item.kind === 'file' && item.type.startsWith('image/')) {
					hasImage = true;
					break;
				}
			}
		} else if (dt.files) {
			for (let i = 0; i < dt.files.length; i++) {
				const file = dt.files[i];
				if (file?.type.startsWith('image/')) {
					hasImage = true;
					break;
				}
			}
		}

		if (hasImage) {
			event.preventDefault();
			event.stopPropagation();

			imageDragOver = true;
			imageDragPosition = { x: event.clientX, y: event.clientY };
		}
	}

	function handleImageDragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		imageDragOver = false;
		imageDragPosition = null;
	}

	async function handleImageDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		const dropX = event.clientX;
		const dropY = event.clientY;
		imageDragOver = false;
		imageDragPosition = null;

		if (!event.dataTransfer?.files?.length) return;

		const imageFiles = Array.from(event.dataTransfer.files).filter((f) =>
			f?.type.startsWith('image/')
		);
		if (imageFiles.length === 0) return;

		// Calculate starting grid position from drop coordinates
		let gridX = 0;
		let gridY = 0;
		if (container) {
			const rect = container.getBoundingClientRect();
			const currentMargin = isMobile ? mobileMargin : margin;
			const cellSize = (rect.width - currentMargin * 2) / COLUMNS;
			const cardW = isMobile ? 4 : 2;

			gridX = clamp(Math.round((dropX - rect.left - currentMargin) / cellSize), 0, COLUMNS - cardW);
			gridX = Math.floor(gridX / 2) * 2;

			gridY = Math.max(Math.round((dropY - rect.top - currentMargin) / cellSize), 0);
			if (isMobile) {
				gridY = Math.floor(gridY / 2) * 2;
			}
		}

		for (const file of imageFiles) {
			await processImageFile(file, gridX, gridY);

			// Move to next cell position
			const cardW = isMobile ? 4 : 2;
			gridX += cardW;
			if (gridX + cardW > COLUMNS) {
				gridX = 0;
				gridY += isMobile ? 4 : 2;
			}
		}
	}

	async function handleImageInputChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!target.files || target.files.length < 1) return;

		const files = Array.from(target.files);

		if (files.length === 1) {
			// Single file: use default positioning
			await processImageFile(files[0]);
		} else {
			// Multiple files: place in grid pattern starting from first available position
			let gridX = 0;
			let gridY = maxHeight;
			const cardW = isMobile ? 4 : 2;
			const cardH = isMobile ? 4 : 2;

			for (const file of files) {
				await processImageFile(file, gridX, gridY);

				// Move to next cell position
				gridX += cardW;
				if (gridX + cardW > COLUMNS) {
					gridX = 0;
					gridY += cardH;
				}
			}
		}

		// Reset the input so the same file can be selected again
		target.value = '';
	}
</script>

<svelte:body
	onpaste={(event) => {
		if (isTyping()) return;

		const text = event.clipboardData?.getData('text/plain');
		const link = validateLink(text, false);
		if (!link) return;

		addLink(link);
	}}
/>

<svelte:window
	ondragover={handleImageDragOver}
	ondragleave={handleImageDragLeave}
	ondrop={handleImageDrop}
/>

<Head
	favicon={data.profile.avatar ?? null}
	title={getName(data)}
	image={'/' + data.handle + '/og.png'}
/>

<Settings bind:open={showSettings} bind:data />

<Context {data}>
	<input
		type="file"
		accept="image/*"
		onchange={handleImageInputChange}
		class="hidden"
		multiple
		bind:this={imageInputRef}
	/>

	{#if !dev}
		<div
			class="bg-base-200 dark:bg-base-800 fixed inset-0 z-50 inline-flex h-full w-full items-center justify-center p-4 text-center lg:hidden"
		>
			Editing on mobile is not supported yet. Please use a desktop browser.
		</div>
	{/if}

	{#if showingMobileView}
		<div
			class="bg-base-200 dark:bg-base-950 pointer-events-none fixed inset-0 -z-10 h-full w-full"
		></div>
	{/if}

	{#if newItem.modal && newItem.item}
		<newItem.modal
			oncreate={() => {
				saveNewItem();
			}}
			bind:item={newItem.item}
			oncancel={() => {
				newItem = {};
			}}
		/>
	{/if}

	<div
		class={[
			'@container/wrapper relative w-full',
			showingMobileView
				? 'bg-base-50 dark:bg-base-900 my-4 min-h-[calc(100dhv-2em)] rounded-2xl lg:mx-auto lg:w-[375px]'
				: ''
		]}
	>
		{#if !getHideProfile(data)}
			<Profile {data} />
		{/if}

		<div
			class={[
				'mx-auto max-w-lg',
				!getHideProfile(data)
					? '@5xl/wrapper:grid @5xl/wrapper:max-w-7xl @5xl/wrapper:grid-cols-4'
					: '@5xl/wrapper:max-w-4xl'
			]}
		>
			<div></div>
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				bind:this={container}
				ondragover={(e) => {
					e.preventDefault();

					const result = getDragXY(e);
					if (!result) return;

					activeDragElement.x = result.x;
					activeDragElement.y = result.y;

					if (activeDragElement.item) {
						// Get dragged card's original position for swapping
						const draggedOrigPos = activeDragElement.originalPositions.get(
							activeDragElement.item.id
						);

						// Reset all items to original positions first
						for (const it of items) {
							const origPos = activeDragElement.originalPositions.get(it.id);
							if (origPos && it !== activeDragElement.item) {
								if (isMobile) {
									it.mobileX = origPos.mobileX;
									it.mobileY = origPos.mobileY;
								} else {
									it.x = origPos.x;
									it.y = origPos.y;
								}
							}
						}

						// Update dragged item position
						if (isMobile) {
							activeDragElement.item.mobileX = result.x;
							activeDragElement.item.mobileY = result.y;
						} else {
							activeDragElement.item.x = result.x;
							activeDragElement.item.y = result.y;
						}

						// Handle horizontal swap
						if (result.swapWithId && draggedOrigPos) {
							const swapTarget = items.find((it) => it.id === result.swapWithId);
							if (swapTarget) {
								// Move swap target to dragged card's original position
								if (isMobile) {
									swapTarget.mobileX = draggedOrigPos.mobileX;
									swapTarget.mobileY = draggedOrigPos.mobileY;
								} else {
									swapTarget.x = draggedOrigPos.x;
									swapTarget.y = draggedOrigPos.y;
								}
							}
						}

						// Now fix collisions (with compacting)
						fixCollisions(items, activeDragElement.item, isMobile);
					}

					// Auto-scroll when dragging near top or bottom of viewport
					const scrollZone = 100;
					const scrollSpeed = 10;
					const viewportHeight = window.innerHeight;

					if (e.clientY < scrollZone) {
						// Near top - scroll up
						const intensity = 1 - e.clientY / scrollZone;
						window.scrollBy(0, -scrollSpeed * intensity);
					} else if (e.clientY > viewportHeight - scrollZone) {
						// Near bottom - scroll down
						const intensity = 1 - (viewportHeight - e.clientY) / scrollZone;
						window.scrollBy(0, scrollSpeed * intensity);
					}
				}}
				ondragend={async (e) => {
					e.preventDefault();
					const cell = getDragXY(e);
					if (!cell) return;

					if (activeDragElement.item) {
						if (isMobile) {
							activeDragElement.item.mobileX = cell.x;
							activeDragElement.item.mobileY = cell.y;
						} else {
							activeDragElement.item.x = cell.x;
							activeDragElement.item.y = cell.y;
						}

						// Fix collisions and compact items after drag ends
						fixCollisions(items, activeDragElement.item, isMobile);
					}
					activeDragElement.x = -1;
					activeDragElement.y = -1;
					activeDragElement.element = null;
					activeDragElement.item = null;
					activeDragElement.lastTargetId = null;
					activeDragElement.lastPlacement = null;
					return true;
				}}
				class={[
					'@container/grid relative col-span-3 rounded-4xl px-2 py-8 @5xl/wrapper:px-8',
					imageDragOver && 'outline-accent-500 outline-3 -outline-offset-10 outline-dashed'
				]}
			>
				{#each items as item, i (item.id)}
					<!-- {#if item !== activeDragElement.item} -->
					<BaseEditingCard
						bind:item={items[i]}
						ondelete={() => {
							items = items.filter((it) => it !== item);
							compactItems(items, isMobile);
						}}
						onsetsize={(newW: number, newH: number) => {
							if (isMobile) {
								item.mobileW = newW;
								item.mobileH = newH;
							} else {
								item.w = newW;
								item.h = newH;
							}

							fixCollisions(items, item, isMobile);
						}}
						ondragstart={(e) => {
							const target = e.currentTarget as HTMLDivElement;
							activeDragElement.element = target;
							activeDragElement.w = item.w;
							activeDragElement.h = item.h;
							activeDragElement.item = item;

							// Store original positions of all items
							activeDragElement.originalPositions = new Map();
							for (const it of items) {
								activeDragElement.originalPositions.set(it.id, {
									x: it.x,
									y: it.y,
									mobileX: it.mobileX,
									mobileY: it.mobileY
								});
							}

							const rect = target.getBoundingClientRect();
							activeDragElement.mouseDeltaX = rect.left - e.clientX;
							activeDragElement.mouseDeltaY = rect.top - e.clientY;
						}}
					>
						<EditingCard bind:item={items[i]} />
					</BaseEditingCard>
					<!-- {/if} -->
				{/each}

				<div style="height: {((maxHeight + 2) / 8) * 100}cqw;"></div>
			</div>
		</div>
	</div>

	<!-- <Settings bind:open={showSettings} /> -->

	<Sidebar mobileOnly mobileClasses="lg:block p-4 gap-4">
		<div class="flex flex-col gap-2">
			{#each sidebarItems as cardDef}
				{#if cardDef.sidebarComponent}
					<cardDef.sidebarComponent onclick={() => newCard(cardDef.type)} />
				{:else if cardDef.sidebarButtonText}
					<Button onclick={() => newCard(cardDef.type)} variant="ghost" class="w-full justify-start"
						>{cardDef.sidebarButtonText}</Button
					>
				{/if}
			{/each}
		</div>
	</Sidebar>

	{#if dev || (!client.isLoggedIn && !client.isInitializing) || client.profile?.did === data.did}
		<Navbar
			class={[
				'dark:bg-base-900 bg-base-100 top-auto bottom-2 mx-4 mt-3 max-w-3xl rounded-full px-4 md:mx-auto lg:inline-flex',
				!dev ? 'hidden' : ''
			]}
		>
			<div class="flex items-center gap-2">
				<Button
					size="iconLg"
					variant="ghost"
					class="backdrop-blur-none"
					onclick={() => {
						newCard('text');
					}}
				>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
						><path
							fill="none"
							stroke="currentColor"
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="1.5"
							d="m15 16l2.536-7.328a1.02 1.02 1 0 1 1.928 0L22 16m-6.303-2h5.606M2 16l4.039-9.69a.5.5 0 0 1 .923 0L11 16m-7.696-3h6.392"
						/></svg
					>
				</Button>

				<Popover sideOffset={16} bind:open={linkPopoverOpen} class="bg-base-100 dark:bg-base-900">
					{#snippet child({ props })}
						<Button
							size="iconLg"
							variant="ghost"
							class="backdrop-blur-none"
							onclick={() => {
								newCard('link');
							}}
							{...props}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="-2 -2 28 28"
								stroke-width="1.5"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
								/>
							</svg>
						</Button>
					{/snippet}
					<Input
						spellcheck={false}
						type="url"
						bind:value={linkValue}
						onkeydown={(event) => {
							if (event.code === 'Enter') {
								addLink(linkValue);
								event.preventDefault();
							}
						}}
						placeholder="Enter link"
					/>
					<Button onclick={() => addLink(linkValue)} size="icon"
						><svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
							class="size-6"
						>
							<path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
						</svg>
					</Button>
				</Popover>

				<Button
					size="iconLg"
					variant="ghost"
					class="backdrop-blur-none"
					onclick={() => {
						imageInputRef?.click();
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
						/>
					</svg>
				</Button>

				<Button
					size="iconLg"
					variant="ghost"
					class="backdrop-blur-none"
					popovertarget="mobile-menu"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
					</svg>
				</Button>
			</div>
			<div class="flex items-center gap-2">
				<Button
					size="iconLg"
					variant="ghost"
					class="backdrop-blur-none"
					onclick={() => {
						showSettings = true;
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke-width="1.5"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
						/>
					</svg>
				</Button>
				<Toggle
					class="hidden bg-transparent backdrop-blur-none lg:block dark:bg-transparent"
					bind:pressed={showingMobileView}
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
							d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
						/>
					</svg>
				</Toggle>
				{#if client.isLoggedIn}
					<Button
						disabled={isSaving}
						onclick={async () => {
							save();
						}}>{isSaving ? 'Saving...' : 'Save'}</Button
					>
				{:else}
					<BlueskyLogin
						login={async (handle) => {
							await login(handle);
							return true;
						}}
					/>
				{/if}
			</div>
		</Navbar>
	{/if}

	<Toaster />
</Context>
