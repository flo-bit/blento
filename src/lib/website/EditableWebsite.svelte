<script lang="ts">
	import { Button, toast, Toaster, Sidebar } from '@foxui/core';
	import { COLUMNS, margin, mobileMargin } from '$lib';
	import {
		checkAndUploadImage,
		clamp,
		compactItems,
		createEmptyCard,
		fixCollisions,
		getHideProfileSection,
		getName,
		isTyping,
		savePage,
		scrollToItem,
		setPositionOfNewItem,
		validateLink
	} from '../helper';
	import EditableProfile from './EditableProfile.svelte';
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
	import Account from './Account.svelte';
	import EditBar from './EditBar.svelte';
	import { user } from '$lib/atproto';

	let {
		data
	}: {
		data: WebsiteData;
	} = $props();

	let imageDragOver = $state(false);

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

		try {
			// Upload profile icon if changed
			if (data.publication?.icon) {
				await checkAndUploadImage(data.publication, 'icon');
			}

			await savePage(data, items, publication);

			publication = JSON.stringify(data.publication);
		} catch {
			toast.error('Error saving page!');
		} finally {
			isSaving = false;
		}
	}

	const sidebarItems = AllCardDefinitions.filter((cardDef) => cardDef.sidebarButtonText);

	let showSettings = $state(false);

	let debugPoint = $state({ x: 0, y: 0 });

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
				toast(cardDef.name + ' added!');
				break;
			}
		}

		if (linkValue === url) {
			linkValue = '';
		}
	}

	async function processImageFile(file: File, gridX?: number, gridY?: number) {
		const isGif = file.type === 'image/gif';

		// Don't compress GIFs to preserve animation
		const processedFile = isGif ? file : await compressImage(file);
		const objectUrl = URL.createObjectURL(processedFile);

		let item = createEmptyCard(data.page);

		item.cardType = isGif ? 'gif' : 'image';
		item.cardData = {
			image: { blob: processedFile, objectUrl }
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
		}
	}

	function handleImageDragLeave(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		imageDragOver = false;
	}

	async function handleImageDrop(event: DragEvent) {
		event.preventDefault();
		event.stopPropagation();
		const dropX = event.clientX;
		const dropY = event.clientY;
		imageDragOver = false;

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

	async function processVideoFile(file: File) {
		const objectUrl = URL.createObjectURL(file);

		let item = createEmptyCard(data.page);

		item.cardType = 'video';
		item.cardData = {
			blob: file,
			objectUrl
		};

		setPositionOfNewItem(item, items);
		items = [...items, item];

		await tick();

		scrollToItem(item, isMobile, container);
	}

	async function handleVideoInputChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!target.files || target.files.length < 1) return;

		const files = Array.from(target.files);

		for (const file of files) {
			await processVideoFile(file);
		}

		// Reset the input so the same file can be selected again
		target.value = '';
	}

	$inspect(items);
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

<Account {data} />

<Context {data}>
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
		{#if !getHideProfileSection(data)}
			<EditableProfile bind:data />
		{/if}

		<div
			class={[
				'mx-auto max-w-lg',
				!getHideProfileSection(data)
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
						ondragstart={(e: DragEvent) => {
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

	<Sidebar mobileOnly mobileClasses="lg:block p-4 gap-4">
		<div class="flex flex-col gap-2">
			{#each sidebarItems as cardDef (cardDef.type)}
				<Button onclick={() => newCard(cardDef.type)} variant="ghost" class="w-full justify-start"
					>{cardDef.sidebarButtonText}</Button
				>
			{/each}
		</div>
	</Sidebar>

	{#if user.isLoggedIn}
		<EditBar
			{data}
			bind:linkValue
			bind:isSaving
			bind:showingMobileView
			bind:showSettings
			{newCard}
			{addLink}
			{save}
			{handleImageInputChange}
			{handleVideoInputChange}
		/>
	{/if}

	<Toaster />
</Context>
