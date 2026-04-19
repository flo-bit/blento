<script lang="ts">
	import { Button, Modal, toast, Toaster } from '@foxui/core';
	import {
		checkAndUploadImage,
		createEmptyCard,
		getHideProfileSection,
		getProfilePosition,
		getName,
		isTyping,
		savePage,
		scrollToItem,
		validateLink,
		getImage
	} from '../helper';
	import EditableProfile from './EditableProfile.svelte';
	import type { Item, WebsiteData } from '../types';
	import { innerWidth } from 'svelte/reactivity/window';
	import { AllCardDefinitions, CardDefinitionsByType } from '../cards';
	import { tick, type Component } from 'svelte';
	import type { CardDefinition, CreationModalComponentProps } from '../cards/types';
	import { page } from '$app/state';
	import { setIsCoarse, setIsMobile, setSelectedCardId, setSelectCard } from './context';
	import Context from './Context.svelte';
	import Head from './Head.svelte';
	import Account from './Account.svelte';
	import SettingsOverlay from './settings/SettingsOverlay.svelte';
	import EditBar from './EditBar.svelte';
	import SaveModal from './SaveModal.svelte';
	import FloatingEditButton from './FloatingEditButton.svelte';
	import { user } from '$lib/atproto';
	import * as TID from '@atcute/tid';
	import { launchConfetti } from '@foxui/visual';

	import SectionsSidebar from './SectionsSidebar.svelte';

	import { createImageCard, createVideoCard } from './file-processing';
	import CardCommand from '$lib/components/card-command/CardCommand.svelte';
	import ImageViewerProvider from '$lib/components/image-viewer/ImageViewerProvider.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import { shouldMirror, mirrorLayout } from '$lib/layout';
	import { SectionDefinitionsByType } from '$lib/sections';
	import { isSectionsEditingEnabled } from '$lib/sections/feature-flag';
	import type { SectionRecord } from '$lib/types';

	let {
		data
	}: {
		data: WebsiteData;
	} = $props();

	// Check if floating login button will be visible (to hide MadeWithBlento)
	const showLoginOnEditPage = $derived(!user.isLoggedIn);

	const sectionsEditingEnabled = $derived(isSectionsEditingEnabled(data.did));

	const ogImageUrl = $derived.by(() => {
		const origin = page.url.origin;
		const v = data.updatedAt ? `?v=${data.updatedAt}` : '';
		if (page.data.customDomain) return `${origin}/og-new.png${v}`;
		const handle = data.profile?.handle;
		const actor = handle && handle !== 'handle.invalid' ? handle : data.did;
		return `${origin}/${actor}/og-new.png${v}`;
	});

	// Snapshot the original cards and sections so savePage can detect deletions.
	const originalCards: Item[] = structuredClone(data.cards);
	const originalSections: SectionRecord[] = structuredClone(data.sections);

	// svelte-ignore state_referenced_locally
	let items: Item[] = $state(data.cards);
	// svelte-ignore state_referenced_locally
	let sections: SectionRecord[] = $state(data.sections);

	// svelte-ignore state_referenced_locally
	let publication = $state(JSON.stringify(data.publication));

	// svelte-ignore state_referenced_locally
	let savedItemsSnapshot = JSON.stringify(data.cards);

	// svelte-ignore state_referenced_locally
	let savedPronouns = $state(JSON.stringify(data.pronounsRecord));

	let hasUnsavedChanges = $state(false);

	// Detect card content and publication changes (e.g. sidebar edits)
	// The guard ensures JSON.stringify only runs while no changes are detected yet.
	// Once hasUnsavedChanges is true, Svelte still fires this effect on item mutations
	// but the early return makes it effectively free.
	$effect(() => {
		if (hasUnsavedChanges) return;
		if (
			JSON.stringify(items) !== savedItemsSnapshot ||
			JSON.stringify(data.publication) !== publication ||
			JSON.stringify(data.pronounsRecord) !== savedPronouns
		) {
			hasUnsavedChanges = true;
		}
	});

	let gridRefs = new SvelteMap<string, HTMLDivElement>();

	let showingMobileView = $state(false);
	let isMobile = $derived(showingMobileView || (innerWidth.current ?? 1000) < 1024);
	let showMobileWarning = $state((innerWidth.current ?? 1000) < 1024);

	setIsMobile(() => isMobile);

	// svelte-ignore state_referenced_locally
	let editedOn = $state(data.publication.preferences?.editedOn ?? 0);

	let layoutMode = $derived(data.publication.preferences?.layoutMode);

	function onLayoutChanged() {
		hasUnsavedChanges = true;
		// Set the bit for the current layout: desktop=1, mobile=2
		editedOn = editedOn | (isMobile ? 2 : 1);
		if (shouldMirror(editedOn, layoutMode, isMobile)) {
			mirrorLayout(items, isMobile);
		}
	}

	const isCoarse = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;
	setIsCoarse(() => isCoarse);

	let selectedCardId: string | null = $state(null);
	let selectedCard = $derived(
		selectedCardId ? (items.find((i) => i.id === selectedCardId) ?? null) : null
	);

	setSelectedCardId(() => selectedCardId);
	setSelectCard((id: string | null) => {
		selectedCardId = id;
	});

	let activeSectionId = $state(sections[0]?.id);
	let gridContainer = $derived(
		activeSectionId ? gridRefs.get(activeSectionId) : gridRefs.values().next().value
	);

	let pendingExtraData: Record<string, any> | undefined = $state();

	let activeSection = $derived(sections.find((s) => s.id === activeSectionId));
	let activeSectionDef = $derived(
		activeSection ? SectionDefinitionsByType[activeSection.sectionType] : undefined
	);

	function requestAddCard(extraData?: Record<string, any>) {
		pendingExtraData = extraData;
		showCardCommand = true;
	}

	function newCard(type: string = 'link', cardData?: any) {
		selectedCardId = null;

		let item = createEmptyCard(data.page, activeSectionId);
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

	function cleanupDialogArtifacts() {
		// bits-ui's body scroll lock and portal may not clean up fully when the
		// modal is unmounted instead of closed via the open prop.
		const restore = () => {
			document.body.style.removeProperty('overflow');
			document.body.style.removeProperty('pointer-events');
			document.body.style.removeProperty('padding-right');
			document.body.style.removeProperty('margin-right');
			// Remove any orphaned dialog overlay/content elements left by the portal
			for (const el of document.querySelectorAll('[data-dialog-overlay], [data-dialog-content]')) {
				el.remove();
			}
		};
		// Run immediately and again after bits-ui's 24ms scheduled cleanup
		restore();
		setTimeout(restore, 50);
	}

	function addItem(item: Item, extraData?: Record<string, any>) {
		const ref = item.sectionId ? gridRefs.get(item.sectionId) : gridContainer;

		if (activeSectionDef?.addItem) {
			items = activeSectionDef.addItem(item, items, { gridRef: ref, isMobile, extraData });
		} else {
			items = [...items, item];
		}

		onLayoutChanged();
		return ref;
	}

	async function createFileCards(files: File[]): Promise<Item[]> {
		const cards: Item[] = [];
		for (const file of files) {
			if (file.type.startsWith('video/')) {
				cards.push(createVideoCard(file, data.page));
			} else {
				cards.push(await createImageCard(file, data.page));
			}
		}
		return cards;
	}

	async function saveNewItem() {
		if (!newItem.item) return;
		const item = newItem.item;
		const extraData = pendingExtraData;
		pendingExtraData = undefined;

		const ref = addItem(item, extraData);

		newItem = {};

		await tick();
		cleanupDialogArtifacts();

		scrollToItem(item, isMobile, ref);
	}

	let isSaving = $state(false);
	let showSaveModal = $state(false);
	let saveSuccess = $state(false);

	let newItem: { modal?: Component<CreationModalComponentProps>; item?: Item } = $state({});

	async function save() {
		isSaving = true;
		saveSuccess = false;
		showSaveModal = true;

		try {
			// Upload profile icon if changed
			if (data.publication?.icon) {
				await checkAndUploadImage(data.publication, 'icon');
			}

			// Persist layout editing state
			data.publication.preferences ??= {};
			data.publication.preferences.editedOn = editedOn;

			data.sections = sections;
			await savePage(data, items, originalCards, publication, originalSections);

			publication = JSON.stringify(data.publication);
			savedPronouns = JSON.stringify(data.pronounsRecord);

			savedItemsSnapshot = JSON.stringify(items);
			hasUnsavedChanges = false;

			saveSuccess = true;

			launchConfetti();
		} catch (error) {
			console.error(error);
			showSaveModal = false;
			toast.error(error instanceof Error ? error.message : 'Error saving page!');
		} finally {
			isSaving = false;
		}
	}

	let showSectionsSidebar = $state(false);

	function addSection(sectionType: string, afterIndex?: number) {
		const sorted = sections.toSorted((a, b) => a.index - b.index);
		let newIndex: number;
		if (afterIndex !== undefined && afterIndex < sorted.length) {
			const curr = sorted[afterIndex].index;
			const next = afterIndex + 1 < sorted.length ? sorted[afterIndex + 1].index : curr + 200;
			newIndex = Math.floor((curr + next) / 2);
		} else {
			newIndex = (sorted[sorted.length - 1]?.index ?? 0) + 100;
		}

		const def = SectionDefinitionsByType[sectionType];
		const section: SectionRecord = {
			id: TID.now(),
			sectionType,
			page: data.page,
			index: newIndex,
			sectionData: def?.defaultSectionData?.() ?? {},
			version: 1
		};
		sections = [...sections, section];
		hasUnsavedChanges = true;
	}

	function deleteSection(id: string) {
		if (sections.length <= 1) return;
		items = items.filter((i) => i.sectionId !== id);
		sections = sections.filter((s) => s.id !== id);
		if (activeSectionId === id) {
			activeSectionId = sections[0]?.id;
		}
		hasUnsavedChanges = true;
	}

	let linkValue = $state('');

	function addLink(url: string, specificCardDef?: CardDefinition) {
		let link = validateLink(url);
		if (!link) {
			toast.error('invalid link');
			return;
		}
		let item = createEmptyCard(data.page, activeSectionId);

		if (specificCardDef?.onUrlHandler?.(link, item)) {
			item.cardType = specificCardDef.type;
			newItem.item = item;
			saveNewItem();
			toast(specificCardDef.name + ' added!');
			return;
		}

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
	}

	async function handleFileInputChange(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!target.files || target.files.length < 1) return;

		const extraData = pendingExtraData;
		pendingExtraData = undefined;

		const cards = await createFileCards(Array.from(target.files));
		for (const card of cards) {
			card.sectionId = activeSectionId;
			addItem(card, extraData);
		}

		target.value = '';
	}

	let showCardCommand = $state(false);
</script>

<svelte:window
	onbeforeunload={(e) => {
		if (hasUnsavedChanges) {
			e.preventDefault();
			return '';
		}
	}}
/>

<svelte:body
	onkeydown={(e) => {
		if (e.key === 'Escape' && selectedCardId) {
			selectedCardId = null;
		}
	}}
	onpaste={(event) => {
		if (isTyping()) return;

		const text = event.clipboardData?.getData('text/plain');
		const link = validateLink(text, false);
		if (!link) return;

		addLink(link);
	}}
/>

<Head
	favicon={getImage(data.publication, data.did, 'icon') || data.profile.avatar}
	title={getName(data)}
	image={ogImageUrl}
	accentColor={data.publication?.preferences?.accentColor}
	baseColor={data.publication?.preferences?.baseColor}
/>

<Account bind:data />

{#if sectionsEditingEnabled}
	<button
		type="button"
		class="bg-base-100 dark:bg-base-950 border-base-200 dark:border-base-800 text-base-600 dark:text-base-400 hover:text-base-800 dark:hover:text-base-200 fixed top-3 left-3 z-20 flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium shadow-md transition-colors"
		onclick={() => (showSectionsSidebar = true)}
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="size-4"
		>
			<rect x="3" y="3" width="18" height="18" rx="2" />
			<path d="M3 9h18" />
			<path d="M3 15h18" />
		</svg>
		Layout
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
			class="size-3"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	</button>
{/if}

<SettingsOverlay bind:data publicationUrl={data.publication?.url} />

<Context {data} isEditing={true}>
	<ImageViewerProvider />
	<CardCommand
		bind:open={showCardCommand}
		filter={activeSectionDef?.cardFilter}
		onselect={(cardDef: CardDefinition) => {
			if (cardDef.type === 'image' || cardDef.type === 'video') {
				const input = document.getElementById('file-input') as HTMLInputElement;
				if (input) {
					input.click();
					return;
				}
			}
			newCard(cardDef.type);
		}}
		onlink={(url, cardDef) => {
			addLink(url, cardDef);
		}}
	/>

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
			oncancel={async () => {
				newItem = {};
				await tick();
				cleanupDialogArtifacts();
			}}
		/>
	{/if}

	<SaveModal
		bind:open={showSaveModal}
		success={saveSuccess}
		handle={data.profile?.handle ?? data.handle}
		did={data.did}
		page={data.page}
	/>

	{#if sectionsEditingEnabled}
		<SectionsSidebar
			bind:open={showSectionsSidebar}
			bind:sections
			bind:activeSectionId
			bind:data
			ondelete={deleteSection}
			onlayoutchange={() => (hasUnsavedChanges = true)}
			onadd={(type) => addSection(type)}
		/>
	{/if}

	<Modal open={showMobileWarning} closeButton={false}>
		<div class="flex flex-col items-center gap-4 text-center">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
				class="text-accent-500 size-10"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3"
				/>
			</svg>
			<p class="text-base-700 dark:text-base-300 text-xl font-bold">Mobile Editing</p>
			<p class="text-base-500 dark:text-base-400 text-sm">
				Mobile editing is currently experimental. For the best experience, use a desktop browser.
			</p>
			<Button class="mt-2 w-full" onclick={() => (showMobileWarning = false)}>Continue</Button>
		</div>
	</Modal>

	<div
		class={[
			'group/wrapper @container/wrapper relative w-full overflow-x-hidden',
			showingMobileView
				? 'bg-base-50 dark:bg-base-900 my-4 min-h-[calc(100dvh-2em)] overflow-hidden rounded-2xl lg:mx-auto lg:w-90'
				: ''
		]}
	>
		{#if !getHideProfileSection(data)}
			<EditableProfile bind:data hideBlento={showLoginOnEditPage} />
		{/if}

		<div
			class={[
				'pointer-events-none relative mx-auto max-w-lg',
				(!getHideProfileSection(data) && getProfilePosition(data) === 'side') ||
				(showSectionsSidebar && getHideProfileSection(data))
					? '@5xl/wrapper:grid @5xl/wrapper:max-w-7xl @5xl/wrapper:grid-cols-4'
					: '@5xl/wrapper:max-w-4xl'
			]}
		>
			<div class="pointer-events-none"></div>
			<div class="@5xl/wrapper:col-start-2 @5xl/wrapper:-col-end-1">
				{#each sections.toSorted((a, b) => a.index - b.index) as section, i (section.id)}
					{@const def = SectionDefinitionsByType[section.sectionType]}
					{#if def}
						<def.editingContentComponent
							{section}
							bind:items
							{isMobile}
							{selectedCardId}
							{isCoarse}
							isActive={activeSectionId === section.id}
							onrefchange={(el) => {
								if (el) gridRefs.set(section.id, el);
								else gridRefs.delete(section.id);
							}}
							onlayoutchange={onLayoutChanged}
							ondeselect={() => {
								selectedCardId = null;
							}}
							onrequestaddcard={(extraData) => {
								activeSectionId = section.id;
								requestAddCard(extraData);
							}}
							oncreatefilecards={createFileCards}
							onactivate={() => {
								activeSectionId = section.id;
							}}
						/>
					{/if}
				{/each}
				<div class="h-20"></div>
			</div>
		</div>
	</div>

	<EditBar
		{data}
		bind:linkValue
		bind:isSaving
		bind:showingMobileView
		{hasUnsavedChanges}
		{newCard}
		{addLink}
		{save}
		{handleFileInputChange}
		showCardCommand={() => {
			requestAddCard();
		}}
		{selectedCard}
		{isMobile}
		{isCoarse}
		ondeselect={() => {
			selectedCardId = null;
		}}
		ondelete={() => {
			if (selectedCard) {
				const section = sections.find((s) => s.id === selectedCard!.sectionId);
				const def = section ? SectionDefinitionsByType[section.sectionType] : undefined;
				if (def?.deleteItem) {
					items = def.deleteItem(selectedCardId!, items, selectedCard.sectionId!);
				} else {
					items = items.filter((it) => it.id !== selectedCardId);
				}
				onLayoutChanged();
				selectedCardId = null;
			}
		}}
		onsetsize={(w: number, h: number) => {
			if (selectedCard) {
				const section = sections.find((s) => s.id === selectedCard!.sectionId);
				const def = section ? SectionDefinitionsByType[section.sectionType] : undefined;
				if (def?.resizeItem) {
					def.resizeItem(selectedCard, items, w, h, isMobile);
				}
				onLayoutChanged();
			}
		}}
		allowRotate={(() => {
			if (!selectedCard) return false;
			const section = sections.find((s) => s.id === selectedCard.sectionId);
			const def = section ? SectionDefinitionsByType[section.sectionType] : undefined;
			const cardDef = CardDefinitionsByType[selectedCard.cardType];
			return !!def?.allowRotate && cardDef?.allowRotate !== false;
		})()}
		onrotate={(delta: number) => {
			if (selectedCard) {
				selectedCard.rotation = (selectedCard.rotation ?? 0) + delta;
				onLayoutChanged();
			}
		}}
		sidebarOpen={showSectionsSidebar}
	/>

	<Toaster />

	<FloatingEditButton {data} />
</Context>
