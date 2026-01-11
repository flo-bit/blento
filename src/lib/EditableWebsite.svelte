<script lang="ts">
	import { client, login } from '$lib/oauth/auth.svelte.js';

	import { Navbar, Button, toast, Toaster, Toggle, Sidebar } from '@foxui/core';
	import { BlueskyLogin } from '@foxui/social';

	import { COLUMNS, margin, mobileMargin } from '$lib';
	import {
		cardsEqual,
		clamp,
		compactItems,
		fixCollisions,
		setCanEdit,
		setIsMobile,
		setPositionOfNewItem,
		simulateFinalPosition
	} from './helper';
	import Profile from './Profile.svelte';
	import type { Item } from './types';
	import { deleteRecord, putRecord } from './oauth/atproto';
	import { innerWidth } from 'svelte/reactivity/window';
	import { TID } from '@atproto/common-web';
	import EditingCard from './cards/Card/EditingCard.svelte';
	import { AllCardDefinitions, CardDefinitionsByType } from './cards';
	import { tick, type Component } from 'svelte';
	import type { CreationModalComponentProps } from './cards/types';
	import { dev } from '$app/environment';
	import { setDidContext, setHandleContext } from './website/context';
	import BaseEditingCard from './cards/BaseCard/BaseEditingCard.svelte';
	import Settings from './Settings.svelte';

	let {
		handle,
		did,
		data,
		items: originalItems,
		settings
	}: { handle: string; did: string; data: any; items: Item[]; settings: any } = $props();

	// svelte-ignore state_referenced_locally
	let items: Item[] = $state(originalItems);

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
	} = $state({
		element: null,
		item: null,
		w: 0,
		h: 0,
		x: -1,
		y: -1,
		mouseDeltaX: 0,
		mouseDeltaY: 0
	});

	let showingMobileView = $state(false);
	let isMobile = $derived(showingMobileView || (innerWidth.current ?? 1000) < 1024);

	setIsMobile(() => isMobile);

	setCanEdit(() => dev || (client.isLoggedIn && client.profile?.did === did));

	// svelte-ignore state_referenced_locally
	setDidContext(did);
	// svelte-ignore state_referenced_locally
	setHandleContext(handle);

	const getX = (item: Item) => (isMobile ? (item.mobileX ?? item.x) : item.x);
	const getY = (item: Item) => (isMobile ? (item.mobileY ?? item.y) : item.y);
	const getW = (item: Item) => (isMobile ? (item.mobileW ?? item.w) : item.w);
	const getH = (item: Item) => (isMobile ? (item.mobileH ?? item.h) : item.h);

	let maxHeight = $derived(items.reduce((max, item) => Math.max(max, getY(item) + getH(item)), 0));

	function newCard(type: string = 'link') {
		// close sidebar if open
		const popover = document.getElementById('mobile-menu');
		if (popover) {
			popover.hidePopover();
		}

		let item: Item = {
			id: TID.nextStr(),
			x: 0,
			y: 0,
			w: 2,
			h: 2,
			mobileH: 4,
			mobileW: 4,
			mobileX: 0,
			mobileY: 0,
			cardType: type,
			cardData: {}
		};
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

		const containerRect = container?.getBoundingClientRect();

		newItem = {};

		await tick();

		// scroll to newly created card
		if (!containerRect) return;
		const currentMargin = isMobile ? mobileMargin : margin;
		const currentY = isMobile ? item.mobileY : item.y;
		const bodyRect = document.body.getBoundingClientRect();
		const offset = containerRect.top - bodyRect.top;
		const cellSize = (containerRect.width - currentMargin * 2) / COLUMNS;
		window.scrollTo({ top: offset + cellSize * (currentY - 1), behavior: 'smooth' });
	}

	let isSaving = $state(false);

	let newItem: { modal?: Component<CreationModalComponentProps>; item?: Item } = $state({});

	async function save() {
		isSaving = true;

		const promises = [];
		// find all cards that have been updated (where items differ from originalItems)
		for (let item of items) {
			const originalItem = originalItems.find((i) => cardsEqual(i, item));

			if (!originalItem) {
				console.log('updated or new item', item);
				item.updatedAt = new Date().toISOString();
				// run optional upload function for this card type
				const cardDef = CardDefinitionsByType[item.cardType];

				if (cardDef?.upload) {
					item = await cardDef?.upload(item);
				}

				promises.push(putRecord({ collection: 'app.blento.card', rkey: item.id, record: item }));
			}
		}

		// delete items that are in originalItems but not in items
		for (let originalItem of originalItems) {
			const item = items.find((i) => i.id === originalItem.id);
			if (!item) {
				console.log('deleting item', originalItem);
				promises.push(deleteRecord({ collection: 'app.blento.card', rkey: originalItem.id, did }));
			}
		}

		await Promise.all(promises);

		isSaving = false;

		fetch('/' + handle + '/api/refreshData');
		console.log('refreshing data');

		toast('Saved', {
			description: 'Your website has been saved!'
		});
	}

	const sidebarItems = AllCardDefinitions.filter(
		(cardDef) => cardDef.sidebarComponent || cardDef.sidebarButtonText
	);

	let showSettings = $state(false);

	let debugPoint = $state({ x: 0, y: 0 });

	function getDragXY(
		e: DragEvent & {
			currentTarget: EventTarget & HTMLDivElement;
		}
	) {
		if (!container) return;

		const x = e.clientX + activeDragElement.mouseDeltaX;
		const y = e.clientY + activeDragElement.mouseDeltaY;

		const rect = container.getBoundingClientRect();

		debugPoint.x = x - rect.left;
		debugPoint.y = y - rect.top + margin;
		console.log(rect.top);

		let gridX = clamp(
			Math.floor(((x - rect.left) / rect.width) * 8),
			0,
			COLUMNS - (activeDragElement.w ?? 0)
		);
		gridX = Math.floor(gridX / 2) * 2;
		let gridY = Math.max(
			Math.round(((y - rect.top + margin) / (rect.width - margin)) * COLUMNS),
			0
		);
		if (isMobile) {
			gridX = Math.floor(gridX / 2) * 2;
			gridY = Math.floor(gridY / 2) * 2;
		}
		return { x: gridX, y: gridY };
	}
</script>

{#if !dev}
	<div
		class="bg-base-200 dark:bg-base-800 fixed inset-0 z-50 inline-flex h-full w-full items-center justify-center p-4 text-center lg:hidden"
	>
		Editing on mobile is not supported yet. Please use a desktop browser.
	</div>
{/if}

{#if showingMobileView}
	<div
		class="bg-base-200 dark:bg-base-900 pointer-events-none fixed inset-0 -z-10 h-full w-full"
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
			? 'bg-base-50 dark:bg-base-950 my-4 min-h-[calc(100dhv-2em)] rounded-2xl lg:mx-auto lg:w-[400px]'
			: ''
	]}
>
	<Profile {handle} {did} {data} />

	<div
		class="mx-auto max-w-2xl @5xl/wrapper:grid @5xl/wrapper:max-w-7xl @5xl/wrapper:grid-cols-4 @7xl/wrapper:grid-cols-3"
	>
		<div></div>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={container}
			ondragover={(e) => {
				e.preventDefault();

				const cell = getDragXY(e);
				if (!cell) return;

				activeDragElement.x = cell.x;
				activeDragElement.y = cell.y;

				if (activeDragElement.item) {
					if (isMobile) {
						activeDragElement.item.mobileX = cell.x;
						activeDragElement.item.mobileY = cell.y;
					} else {
						activeDragElement.item.x = cell.x;
						activeDragElement.item.y = cell.y;
					}

					fixCollisions(items, activeDragElement.item, isMobile);
				}

				// Auto-scroll when dragging near top or bottom of viewport
				const scrollZone = 150;
				const scrollSpeed = 15;
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

					fixCollisions(items, activeDragElement.item, isMobile);
				}
				activeDragElement.x = -1;
				activeDragElement.y = -1;
				activeDragElement.element = null;
				return true;
			}}
			class="@container/grid relative col-span-3 px-2 py-8 @5xl/wrapper:px-8 @7xl/wrapper:col-span-2"
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
							item.mobileW = newW * 2;
							item.mobileH = newH * 2;
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

						const rect = target.getBoundingClientRect();
						activeDragElement.mouseDeltaX = rect.left - e.clientX;
						activeDragElement.mouseDeltaY = rect.top - e.clientY;
						console.log(activeDragElement.mouseDeltaY);
						console.log(rect.width);
					}}
				>
					<EditingCard bind:item={items[i]} />
				</BaseEditingCard>
				<!-- {/if} -->
			{/each}

			{#if activeDragElement.element && activeDragElement.x >= 0 && activeDragElement.item}
				{@const finalPos = simulateFinalPosition(
					items,
					activeDragElement.item,
					activeDragElement.x,
					activeDragElement.y,
					isMobile
				)}
				<div
					class={[
						'bg-base-500/10 absolute aspect-square rounded-2xl transition-transform duration-100'
					]}
					style={`translate: calc(${(finalPos.x / COLUMNS) * 100}cqw + ${margin}px) calc(${(finalPos.y / COLUMNS) * 100}cqw + ${margin}px);

                width: calc(${(getW(activeDragElement.item) / COLUMNS) * 100}cqw - ${margin * 2}px);
                height: calc(${(getH(activeDragElement.item) / COLUMNS) * 100}cqw - ${margin * 2}px);`}
				></div>
			{/if}

			{#if dev}
				<div
					class="absolute size-4 rounded-full bg-red-500"
					style={`translate: ${debugPoint.x}px ${debugPoint.y}px;`}
				></div>
			{/if}
			<div style="height: {((maxHeight + 2) / 8) * 100}cqw;"></div>
		</div>
	</div>
</div>

<Settings bind:open={showSettings} />

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

{#if dev || (!client.isLoggedIn && !client.isInitializing) || client.profile?.did === did}
	<Navbar
		class={[
			'dark:bg-base-900 bg-base-100 top-auto bottom-2 mx-4 mt-3 max-w-3xl rounded-full px-4 md:mx-auto lg:inline-flex',
			!dev ? 'hidden' : ''
		]}
	>
		<div class="flex items-center gap-2">
			{#if dev}
				<Button
					size="iconLg"
					variant="ghost"
					class="mr-4 backdrop-blur-none"
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
			{/if}

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
			<Button
				size="iconLg"
				variant="ghost"
				class="backdrop-blur-none"
				onclick={() => {
					newCard('link');
				}}
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

			<Button
				size="iconLg"
				variant="ghost"
				class="backdrop-blur-none"
				onclick={() => {
					newCard('image');
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

			<Button size="iconLg" variant="ghost" class="backdrop-blur-none" popovertarget="mobile-menu">
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

			<!-- for special stuff -->
			{#if handle === 'blento.app'}
				<Button
					size="iconLg"
					variant="ghost"
					class="backdrop-blur-none"
					onclick={() => {
						newCard('updatedBlentos');
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
							d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
						/>
					</svg>
				</Button>
			{/if}
		</div>
		<div class="flex items-center gap-2">
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
