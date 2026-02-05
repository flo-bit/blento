<script lang="ts">
	import { Button, Modal, toast, Toaster } from '@foxui/core';
	import { COLUMNS } from '$lib';
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
	import EditingCard from '../cards/_base/Card/EditingCard.svelte';
	import { AllCardDefinitions, CardDefinitionsByType } from '../cards';
	import { tick, type Component } from 'svelte';
	import type { CardDefinition, CreationModalComponentProps } from '../cards/types';
	import { dev } from '$app/environment';
	import { setIsCoarse, setIsMobile, setSelectedCardId, setSelectCard } from './context';
	import BaseEditingCard from '../cards/_base/BaseCard/BaseEditingCard.svelte';
	import Context from './Context.svelte';
	import Head from './Head.svelte';
	import Account from './Account.svelte';
	import EditBar from './EditBar.svelte';
	import SaveModal from './SaveModal.svelte';
	import FloatingEditButton from './FloatingEditButton.svelte';
	import { user, resolveHandle, listRecords, getCDNImageBlobUrl } from '$lib/atproto';
	import * as TID from '@atcute/tid';
	import { launchConfetti } from '@foxui/visual';
	import Controls from './Controls.svelte';
	import CardCommand from '$lib/components/card-command/CardCommand.svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import {
		fixCollisions,
		compactItems,
		fixAllCollisions,
		setPositionOfNewItem,
		shouldMirror,
		mirrorLayout,
		getViewportCenterGridY,
		EditableGrid
	} from '$lib/layout';

	let {
		data
	}: {
		data: WebsiteData;
	} = $props();

	// Check if floating login button will be visible (to hide MadeWithBlento)
	const showLoginOnEditPage = $derived(!user.isInitializing && !user.isLoggedIn);

	// svelte-ignore state_referenced_locally
	let items: Item[] = $state(data.cards);

	// svelte-ignore state_referenced_locally
	let publication = $state(JSON.stringify(data.publication));

	// svelte-ignore state_referenced_locally
	let savedItemsSnapshot = JSON.stringify(data.cards);

	let hasUnsavedChanges = $state(false);

	// Detect card content and publication changes (e.g. sidebar edits)
	// The guard ensures JSON.stringify only runs while no changes are detected yet.
	// Once hasUnsavedChanges is true, Svelte still fires this effect on item mutations
	// but the early return makes it effectively free.
	$effect(() => {
		if (hasUnsavedChanges) return;
		if (
			JSON.stringify(items) !== savedItemsSnapshot ||
			JSON.stringify(data.publication) !== publication
		) {
			hasUnsavedChanges = true;
		}
	});

	// Warn user before closing tab if there are unsaved changes
	$effect(() => {
		function handleBeforeUnload(e: BeforeUnloadEvent) {
			if (hasUnsavedChanges) {
				e.preventDefault();
				return '';
			}
		}

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	});

	let gridContainer: HTMLDivElement | undefined = $state();

	let showingMobileView = $state(false);
	let isMobile = $derived(showingMobileView || (innerWidth.current ?? 1000) < 1024);
	let showMobileWarning = $state((innerWidth.current ?? 1000) < 1024);

	setIsMobile(() => isMobile);

	// svelte-ignore state_referenced_locally
	let editedOn = $state(data.publication.preferences?.editedOn ?? 0);

	function onLayoutChanged() {
		hasUnsavedChanges = true;
		// Set the bit for the current layout: desktop=1, mobile=2
		editedOn = editedOn | (isMobile ? 2 : 1);
		if (shouldMirror(editedOn)) {
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

	const getY = (item: Item) => (isMobile ? (item.mobileY ?? item.y) : item.y);
	const getH = (item: Item) => (isMobile ? (item.mobileH ?? item.h) : item.h);
	let maxHeight = $derived(items.reduce((max, item) => Math.max(max, getY(item) + getH(item)), 0));

	function newCard(type: string = 'link', cardData?: any) {
		selectedCardId = null;

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

	async function saveNewItem() {
		if (!newItem.item) return;
		const item = newItem.item;

		const viewportCenter = gridContainer
			? getViewportCenterGridY(gridContainer, isMobile)
			: undefined;
		setPositionOfNewItem(item, items, viewportCenter);

		items = [...items, item];

		// Push overlapping items down, then compact to fill gaps
		fixCollisions(items, item, false, true);
		fixCollisions(items, item, true, true);
		compactItems(items, false);
		compactItems(items, true);

		onLayoutChanged();

		newItem = {};

		await tick();
		cleanupDialogArtifacts();

		scrollToItem(item, isMobile, gridContainer);
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

			await savePage(data, items, publication);

			publication = JSON.stringify(data.publication);

			savedItemsSnapshot = JSON.stringify(items);
			hasUnsavedChanges = false;

			saveSuccess = true;

			launchConfetti();

			// Refresh cached data
			await fetch('/' + data.handle + '/api/refresh');
		} catch (error) {
			console.error(error);
			showSaveModal = false;
			toast.error('Error saving page!');
		} finally {
			isSaving = false;
		}
	}

	function addAllCardTypes() {
		const groupOrder = ['Core', 'Social', 'Media', 'Content', 'Visual', 'Utilities', 'Games'];
		const grouped = new SvelteMap<string, CardDefinition[]>();

		for (const def of AllCardDefinitions) {
			if (!def.name) continue;
			const group = def.groups?.[0] ?? 'Other';
			if (!grouped.has(group)) grouped.set(group, []);
			grouped.get(group)!.push(def);
		}

		// Sort groups by predefined order, unknowns at end
		const sortedGroups = [...grouped.keys()].sort((a, b) => {
			const ai = groupOrder.indexOf(a);
			const bi = groupOrder.indexOf(b);
			return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
		});

		// Sample data for cards that would otherwise render empty
		const sampleData: Record<string, Record<string, unknown>> = {
			text: { text: 'The quick brown fox jumps over the lazy dog. This is a sample text card.' },
			link: {
				href: 'https://bsky.app',
				title: 'Bluesky',
				domain: 'bsky.app',
				description: 'Social networking that gives you choice',
				hasFetched: true
			},
			image: {
				image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600',
				alt: 'Mountain landscape'
			},
			button: { text: 'Visit Bluesky', href: 'https://bsky.app' },
			bigsocial: { platform: 'bluesky', href: 'https://bsky.app', color: '0085ff' },
			blueskyPost: {
				uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3jt64kgkbbs2y',
				href: 'https://bsky.app/profile/bsky.app/post/3jt64kgkbbs2y'
			},
			blueskyProfile: {
				handle: 'bsky.app',
				displayName: 'Bluesky',
				avatar:
					'https://cdn.bsky.app/img/avatar/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreihagr2cmvl2jt4mgx3sppwe2it3fwolkrbtjrhcnwjk4pcnbaq53m@jpeg'
			},
			blueskyMedia: {},
			latestPost: {},
			youtubeVideo: {
				youtubeId: 'dQw4w9WgXcQ',
				poster: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
				href: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				showInline: true
			},
			'spotify-list-embed': {
				spotifyType: 'album',
				spotifyId: '4aawyAB9vmqN3uQ7FjRGTy',
				href: 'https://open.spotify.com/album/4aawyAB9vmqN3uQ7FjRGTy'
			},
			latestLivestream: {},
			livestreamEmbed: {
				href: 'https://stream.place/',
				embed: 'https://stream.place/embed/'
			},
			mapLocation: { lat: 48.8584, lon: 2.2945, zoom: 13, name: 'Eiffel Tower, Paris' },
			gif: { url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.mp4', alt: 'Cat typing' },
			event: {
				uri: 'at://did:plc:257wekqxg4hyapkq6k47igmp/community.lexicon.calendar.event/3mcsoqzy7gm2q'
			},
			guestbook: { label: 'Guestbook' },
			githubProfile: { user: 'sveltejs', href: 'https://github.com/sveltejs' },
			photoGallery: {
				galleryUri: 'at://did:plc:tas6hj2xjrqben5653v5kohk/social.grain.gallery/3mclhsljs6h2w'
			},
			atprotocollections: {},
			publicationList: {},
			recentPopfeedReviews: {},
			recentTealFMPlays: {},
			statusphere: { emoji: '✨' },
			vcard: {},
			'fluid-text': { text: 'Hello World' },
			draw: { strokesJson: '[]', viewBox: '', strokeWidth: 1, locked: true },
			clock: {},
			countdown: { targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() },
			timer: {},
			'dino-game': {},
			tetris: {},
			updatedBlentos: {}
		};

		// Labels for cards that support canHaveLabel
		const sampleLabels: Record<string, string> = {
			image: 'Mountain Landscape',
			mapLocation: 'Eiffel Tower',
			gif: 'Cat Typing',
			bigsocial: 'Bluesky',
			guestbook: 'Guestbook',
			statusphere: 'My Status',
			recentPopfeedReviews: 'My Reviews',
			recentTealFMPlays: 'Recently Played',
			clock: 'Local Time',
			countdown: 'Launch Day',
			timer: 'Timer',
			'dino-game': 'Dino Game',
			tetris: 'Tetris',
			blueskyMedia: 'Bluesky Media'
		};

		const newItems: Item[] = [];
		let cursorY = 0;
		let mobileCursorY = 0;

		for (const group of sortedGroups) {
			const defs = grouped.get(group)!;

			// Add a section heading for the group
			const heading = createEmptyCard(data.page);
			heading.cardType = 'section';
			heading.cardData = { text: group, verticalAlign: 'bottom', textSize: 1 };
			heading.w = COLUMNS;
			heading.h = 1;
			heading.x = 0;
			heading.y = cursorY;
			heading.mobileW = COLUMNS;
			heading.mobileH = 2;
			heading.mobileX = 0;
			heading.mobileY = mobileCursorY;
			newItems.push(heading);
			cursorY += 1;
			mobileCursorY += 2;

			// Place cards in rows
			let rowX = 0;
			let rowMaxH = 0;
			let mobileRowX = 0;
			let mobileRowMaxH = 0;

			for (const def of defs) {
				if (def.type === 'section' || def.type === 'embed') continue;

				const item = createEmptyCard(data.page);
				item.cardType = def.type;
				item.cardData = {};
				def.createNew?.(item);

				// Merge in sample data (without overwriting createNew defaults)
				const extra = sampleData[def.type];
				if (extra) {
					item.cardData = { ...item.cardData, ...extra };
				}

				// Set item-level color for cards that need it
				if (def.type === 'button') {
					item.color = 'transparent';
				}

				// Add label if card supports it
				const label = sampleLabels[def.type];
				if (label && def.canHaveLabel) {
					item.cardData.label = label;
				}

				// Desktop layout
				if (rowX + item.w > COLUMNS) {
					cursorY += rowMaxH;
					rowX = 0;
					rowMaxH = 0;
				}
				item.x = rowX;
				item.y = cursorY;
				rowX += item.w;
				rowMaxH = Math.max(rowMaxH, item.h);

				// Mobile layout
				if (mobileRowX + item.mobileW > COLUMNS) {
					mobileCursorY += mobileRowMaxH;
					mobileRowX = 0;
					mobileRowMaxH = 0;
				}
				item.mobileX = mobileRowX;
				item.mobileY = mobileCursorY;
				mobileRowX += item.mobileW;
				mobileRowMaxH = Math.max(mobileRowMaxH, item.mobileH);

				newItems.push(item);
			}

			// Move cursor past last row
			cursorY += rowMaxH;
			mobileCursorY += mobileRowMaxH;
		}

		items = newItems;
		onLayoutChanged();
	}

	let copyInput = $state('');
	let isCopying = $state(false);

	async function copyPageFrom() {
		const input = copyInput.trim();
		if (!input) return;

		isCopying = true;
		try {
			// Parse "handle" or "handle/page"
			const parts = input.split('/');
			const handle = parts[0];
			const pageName = parts[1] || 'self';

			const did = await resolveHandle({ handle: handle as `${string}.${string}` });
			if (!did) throw new Error('Could not resolve handle');

			const records = await listRecords({ did, collection: 'app.blento.card' });
			const targetPage = 'blento.' + pageName;

			const copiedCards: Item[] = records
				.map((r) => ({ ...r.value }) as Item)
				.filter((card) => {
					// v0/v1 cards without page field belong to blento.self
					if (!card.page) return targetPage === 'blento.self';
					return card.page === targetPage;
				})
				.map((card) => {
					// Apply v0→v1 migration (coords were halved in old format)
					if (!card.version) {
						card.x *= 2;
						card.y *= 2;
						card.h *= 2;
						card.w *= 2;
						card.mobileX *= 2;
						card.mobileY *= 2;
						card.mobileH *= 2;
						card.mobileW *= 2;
						card.version = 1;
					}

					// Convert blob refs to CDN URLs using source DID
					if (card.cardData) {
						for (const key of Object.keys(card.cardData)) {
							const val = card.cardData[key];
							if (val && typeof val === 'object' && val.$type === 'blob') {
								const url = getCDNImageBlobUrl({ did, blob: val });
								if (url) card.cardData[key] = url;
							}
						}
					}

					// Regenerate ID and assign to current page
					card.id = TID.now();
					card.page = data.page;
					return card;
				});

			if (copiedCards.length === 0) {
				toast.error('No cards found on that page');
				return;
			}

			fixAllCollisions(copiedCards, false);
			fixAllCollisions(copiedCards, true);
			compactItems(copiedCards, false);
			compactItems(copiedCards, true);

			items = copiedCards;
			onLayoutChanged();
			toast.success(`Copied ${copiedCards.length} cards from ${handle}`);
		} catch (e) {
			console.error('Failed to copy page:', e);
			toast.error('Failed to copy page');
		} finally {
			isCopying = false;
		}
	}

	let linkValue = $state('');

	function addLink(url: string, specificCardDef?: CardDefinition) {
		let link = validateLink(url);
		if (!link) {
			toast.error('invalid link');
			return;
		}
		let item = createEmptyCard(data.page);

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

	function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
		return new Promise((resolve) => {
			const img = new Image();
			img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
			img.onerror = () => resolve({ width: 1, height: 1 });
			img.src = src;
		});
	}

	function getBestGridSize(
		imageWidth: number,
		imageHeight: number,
		candidates: [number, number][]
	): [number, number] {
		const imageRatio = imageWidth / imageHeight;
		let best: [number, number] = candidates[0];
		let bestDiff = Infinity;

		for (const candidate of candidates) {
			const gridRatio = candidate[0] / candidate[1];
			const diff = Math.abs(Math.log(imageRatio) - Math.log(gridRatio));
			if (diff < bestDiff) {
				bestDiff = diff;
				best = candidate;
			}
		}

		return best;
	}

	const desktopSizeCandidates: [number, number][] = [
		[2, 2],
		[2, 4],
		[4, 2],
		[4, 4],
		[4, 6],
		[6, 4]
	];
	const mobileSizeCandidates: [number, number][] = [
		[4, 4],
		[4, 6],
		[4, 8],
		[6, 4],
		[8, 4],
		[8, 6]
	];

	async function processImageFile(file: File, gridX?: number, gridY?: number) {
		const isGif = file.type === 'image/gif';

		// Don't compress GIFs to preserve animation
		const objectUrl = URL.createObjectURL(file);

		let item = createEmptyCard(data.page);

		item.cardType = isGif ? 'gif' : 'image';
		item.cardData = {
			image: { blob: file, objectUrl }
		};

		// Size card based on image aspect ratio
		const { width, height } = await getImageDimensions(objectUrl);
		const [dw, dh] = getBestGridSize(width, height, desktopSizeCandidates);
		const [mw, mh] = getBestGridSize(width, height, mobileSizeCandidates);
		item.w = dw;
		item.h = dh;
		item.mobileW = mw;
		item.mobileH = mh;

		// If grid position is provided (image dropped on grid)
		if (gridX !== undefined && gridY !== undefined) {
			if (isMobile) {
				item.mobileX = gridX;
				item.mobileY = gridY;
				// Derive desktop Y from mobile
				item.x = Math.floor((COLUMNS - item.w) / 2);
				item.x = Math.floor(item.x / 2) * 2;
				item.y = Math.max(0, Math.round(gridY / 2));
			} else {
				item.x = gridX;
				item.y = gridY;
				// Derive mobile Y from desktop
				item.mobileX = Math.floor((COLUMNS - item.mobileW) / 2);
				item.mobileX = Math.floor(item.mobileX / 2) * 2;
				item.mobileY = Math.max(0, Math.round(gridY * 2));
			}

			items = [...items, item];
			fixCollisions(items, item, isMobile);
			fixCollisions(items, item, !isMobile);
		} else {
			const viewportCenter = gridContainer
				? getViewportCenterGridY(gridContainer, isMobile)
				: undefined;
			setPositionOfNewItem(item, items, viewportCenter);
			items = [...items, item];
			fixCollisions(items, item, false, true);
			fixCollisions(items, item, true, true);
			compactItems(items, false);
			compactItems(items, true);
		}

		onLayoutChanged();

		await tick();

		scrollToItem(item, isMobile, gridContainer);
	}

	async function handleFileDrop(files: File[], gridX: number, gridY: number) {
		for (let i = 0; i < files.length; i++) {
			// First image gets the drop position, rest use normal placement
			if (i === 0) {
				await processImageFile(files[i], gridX, gridY);
			} else {
				await processImageFile(files[i]);
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

		const viewportCenter = gridContainer
			? getViewportCenterGridY(gridContainer, isMobile)
			: undefined;
		setPositionOfNewItem(item, items, viewportCenter);
		items = [...items, item];
		fixCollisions(items, item, false, true);
		fixCollisions(items, item, true, true);
		compactItems(items, false);
		compactItems(items, true);

		onLayoutChanged();

		await tick();

		scrollToItem(item, isMobile, gridContainer);
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

	let showCardCommand = $state(false);
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

<Head
	favicon={getImage(data.publication, data.did, 'icon') || data.profile.avatar}
	title={getName(data)}
	image={'/' + data.handle + '/og.png'}
	accentColor={data.publication?.preferences?.accentColor}
	baseColor={data.publication?.preferences?.baseColor}
/>

<Account {data} />

<Context {data} isEditing={true}>
	<CardCommand
		bind:open={showCardCommand}
		onselect={(cardDef: CardDefinition) => {
			if (cardDef.type === 'image') {
				const input = document.getElementById('image-input') as HTMLInputElement;
				if (input) {
					input.click();
					return;
				}
			} else if (cardDef.type === 'video') {
				const input = document.getElementById('video-input') as HTMLInputElement;
				if (input) {
					input.click();
					return;
				}
			} else {
				newCard(cardDef.type);
			}
		}}
		onlink={(url, cardDef) => {
			addLink(url, cardDef);
		}}
	/>

	<Controls bind:data />

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
		handle={data.handle}
		page={data.page}
	/>

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
			'@container/wrapper relative w-full',
			showingMobileView
				? 'bg-base-50 dark:bg-base-900 my-4 min-h-[calc(100dhv-2em)] rounded-2xl lg:mx-auto lg:w-90'
				: ''
		]}
	>
		{#if !getHideProfileSection(data)}
			<EditableProfile bind:data hideBlento={showLoginOnEditPage} />
		{/if}

		<div
			class={[
				'pointer-events-none relative mx-auto max-w-lg',
				!getHideProfileSection(data) && getProfilePosition(data) === 'side'
					? '@5xl/wrapper:grid @5xl/wrapper:max-w-7xl @5xl/wrapper:grid-cols-4'
					: '@5xl/wrapper:max-w-4xl'
			]}
		>
			<div class="pointer-events-none"></div>
			<EditableGrid
				bind:items
				bind:ref={gridContainer}
				{isMobile}
				{selectedCardId}
				{isCoarse}
				onlayoutchange={onLayoutChanged}
				ondeselect={() => {
					selectedCardId = null;
				}}
				onfiledrop={handleFileDrop}
			>
				{#each items as item, i (item.id)}
					<BaseEditingCard
						bind:item={items[i]}
						ondelete={() => {
							items = items.filter((it) => it !== item);
							compactItems(items, false);
							compactItems(items, true);
							onLayoutChanged();
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
							onLayoutChanged();
						}}
					>
						<EditingCard bind:item={items[i]} />
					</BaseEditingCard>
				{/each}
			</EditableGrid>
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
		{handleImageInputChange}
		{handleVideoInputChange}
		showCardCommand={() => {
			showCardCommand = true;
		}}
		{selectedCard}
		{isMobile}
		{isCoarse}
		ondeselect={() => {
			selectedCardId = null;
		}}
		ondelete={() => {
			if (selectedCard) {
				items = items.filter((it) => it.id !== selectedCardId);
				compactItems(items, false);
				compactItems(items, true);
				onLayoutChanged();
				selectedCardId = null;
			}
		}}
		onsetsize={(w: number, h: number) => {
			if (selectedCard) {
				if (isMobile) {
					selectedCard.mobileW = w;
					selectedCard.mobileH = h;
				} else {
					selectedCard.w = w;
					selectedCard.h = h;
				}
				fixCollisions(items, selectedCard, isMobile);
				onLayoutChanged();
			}
		}}
	/>

	<Toaster />

	<FloatingEditButton {data} />

	{#if dev}
		<div
			class="bg-base-900/70 text-base-100 fixed top-2 right-2 z-50 flex items-center gap-2 rounded px-2 py-1 font-mono text-xs"
		>
			<span>editedOn: {editedOn}</span>
			<button class="underline" onclick={addAllCardTypes}>+ all cards</button>
			<input
				bind:value={copyInput}
				placeholder="handle/page"
				class="bg-base-800 text-base-100 w-32 rounded px-1 py-0.5"
				onkeydown={(e) => {
					if (e.key === 'Enter') copyPageFrom();
				}}
			/>
			<button class="underline" onclick={copyPageFrom} disabled={isCopying}>
				{isCopying ? 'copying...' : 'copy'}
			</button>
		</div>
	{/if}
</Context>
