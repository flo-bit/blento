<script lang="ts">
	import { client, login } from '$lib/oauth/auth.svelte.js';

	import { Navbar, Button, toast, Toaster, Toggle } from '@foxui/core';
	import { BlueskyLogin } from '@foxui/social';

	import { margin, mobileMargin } from '$lib';
	import { cardsEqual, clamp, fixCollisions, setIsMobile, setPositionOfNewItem } from './helper';
	import Profile from './Profile.svelte';
	import type { Item } from './types';
	import { deleteRecord, putRecord } from './oauth/atproto';
	import { innerWidth } from 'svelte/reactivity/window';
	import { TID } from '@atproto/common-web';
	import EditingCard from './cards/Card/EditingCard.svelte';
	import { CardDefinitionsByType } from './cards';
	import { tick, type Component } from 'svelte';
	import type { CreationModalComponentProps } from './cards/types';
	import { dev } from '$app/environment';

	let {
		handle,
		did,
		data,
		items: originalItems
	}: { handle: string; did: string; data: any; items: Item[] } = $props();

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

	const getX = (item: Item) => (isMobile ? (item.mobileX ?? item.x) : item.x);
	const getY = (item: Item) => (isMobile ? (item.mobileY ?? item.y) : item.y);
	const getW = (item: Item) => (isMobile ? (item.mobileW ?? item.w) : item.w);
	const getH = (item: Item) => (isMobile ? (item.mobileH ?? item.h) : item.h);

	let maxHeight = $derived(items.reduce((max, item) => Math.max(max, getY(item) + getH(item)), 0));

	function newCard(type: 'text' | 'image' | 'link' = 'link') {
		let item: Item = {
			id: TID.nextStr(),
			x: 0,
			y: 0,
			w: 1,
			h: 1,
			mobileH: 2,
			mobileW: 2,
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
		const cellSize = (containerRect.width - currentMargin * 2) / 4;
		window.scrollTo({ top: offset + cellSize * (currentY - 1), behavior: 'smooth' });
	}

	let isSaving = $state(false);

	let newItem: { modal?: Component<CreationModalComponentProps>; item?: Item } = $state({});
</script>

{#if !dev}
	<div
		class="bg-base-800 fixed inset-0 z-50 inline-flex h-full w-full items-center justify-center p-4 text-center lg:hidden"
	>
		Editing on mobile is not supported yet. Please use a desktop browser.
	</div>
{/if}

{#if showingMobileView}
	<div class="bg-base-900 pointer-events-none fixed inset-0 -z-10 h-full w-full"></div>
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
		'@container/wrapper relative w-screen',
		showingMobileView
			? 'bg-base-950 my-4 min-h-[calc(100dhv-2em)] rounded-2xl lg:mx-auto lg:w-[400px]'
			: ''
	]}
>
	<Profile {handle} {did} {data} />

	<div
		class="mx-auto max-w-2xl @5xl/wrapper:grid @5xl/wrapper:max-w-none @5xl/wrapper:grid-cols-4 @7xl/wrapper:grid-cols-3"
	>
		<div></div>
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			bind:this={container}
			ondragover={(e) => {
				e.preventDefault();
				if (!container) return;

				const x = e.clientX + activeDragElement.mouseDeltaX;
				const y = e.clientY + activeDragElement.mouseDeltaY;
				const rect = container.getBoundingClientRect();

				let gridX = clamp(
					Math.floor(((x - rect.left) / rect.width) * 4),
					0,
					4 - (activeDragElement.w ?? 0)
				);
				let gridY = Math.max(Math.floor(((y - rect.top) / rect.width) * 4), 0);
				if (isMobile) {
					gridX = Math.floor(gridX / 2) * 2;
					gridY = Math.floor(gridY / 2) * 2;
				}

				activeDragElement.x = gridX;
				activeDragElement.y = gridY;
			}}
			ondragend={async (e) => {
				e.preventDefault();
				if (!container) return;

				const x = e.clientX + activeDragElement.mouseDeltaX;
				const y = e.clientY + activeDragElement.mouseDeltaY;
				const rect = container.getBoundingClientRect();

				let gridX = clamp(
					Math.floor(((x - rect.left) / rect.width) * 4),
					0,
					4 - (activeDragElement.w ?? 0)
				);
				let gridY = Math.max(Math.floor(((y - rect.top) / rect.width) * 4), 0);
				if (isMobile) {
					gridX = Math.floor(gridX / 2) * 2;
					gridY = Math.floor(gridY / 2) * 2;
				}

				if (activeDragElement.item) {
					if (isMobile) {
						activeDragElement.item.mobileX = gridX;
						activeDragElement.item.mobileY = gridY;
					} else {
						activeDragElement.item.x = gridX;
						activeDragElement.item.y = gridY;
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
			{#each items as item, i}
				<EditingCard
					ondragstart={(e) => {
						const target = e.target as HTMLDivElement;
						activeDragElement.element = target;
						activeDragElement.w = item.w;
						activeDragElement.h = item.h;
						activeDragElement.item = item;

						const rect = target.getBoundingClientRect();
						activeDragElement.mouseDeltaX = rect.left + margin - e.clientX;
						activeDragElement.mouseDeltaY = rect.top - e.clientY;
					}}
					bind:item={items[i]}
					ondelete={() => {
						items = items.filter((it) => it !== item);
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
				/>
			{/each}

			{#if activeDragElement.element && activeDragElement.x >= 0 && activeDragElement.item}
				{@const item = activeDragElement}
				<div
					class={['bg-base-500/10 absolute aspect-square rounded-2xl']}
					style={`translate: calc(${(item.x / 4) * 100}cqw + ${margin / 2}px) calc(${(item.y / 4) * 100}cqw + ${margin / 2}px); 
                
                width: calc(${(getW(activeDragElement.item) / 4) * 100}cqw - ${margin}px);
                height: calc(${(getH(activeDragElement.item) / 4) * 100}cqw - ${margin}px);`}
				></div>
			{/if}
			<div style="height: {((maxHeight + 1) / 4) * 100}cqw;"></div>
		</div>
	</div>
</div>

{#if (!client.isLoggedIn && !client.isInitializing) || client.profile?.did === did}
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
						isSaving = true;

						// find all cards that have been updated (where items differ from originalItems)
						for (let item of items) {
							const originalItem = originalItems.find((i) => cardsEqual(i, item));

							if (!originalItem) {
								console.log('updated or new item', item);
								item.updatedAt = new Date().toISOString();
								await putRecord({ collection: 'com.example.bento', rkey: item.id, record: item });
							}
						}

						// delete items that are in originalItems but not in items
						for (let originalItem of originalItems) {
							const item = items.find((i) => i.id === originalItem.id);
							if (!item) {
								console.log('deleting item', originalItem);
								await deleteRecord({ collection: 'com.example.bento', rkey: originalItem.id, did });
							}
						}

						isSaving = false;

						toast('Saved', {
							description: 'Your website has been saved!'
						});
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
