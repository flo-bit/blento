<script lang="ts">
	import { Button, Modal, toast, Toaster, Sidebar } from '@foxui/core';
	import { COLUMNS, margin, mobileMargin } from '$lib';
	import {
		checkAndUploadImage,
		clamp,
		compactItems,
		createEmptyCard,
		findValidPosition,
		fixAllCollisions,
		fixCollisions,
		getHideProfileSection,
		getProfilePosition,
		getName,
		isTyping,
		savePage,
		scrollToItem,
		setPositionOfNewItem,
		validateLink,
		getImage
	} from '../helper';
	import EditableProfile from './EditableProfile.svelte';
	import type { Item, WebsiteData } from '../types';
	import { innerWidth } from 'svelte/reactivity/window';
	import EditingCard from '../cards/Card/EditingCard.svelte';
	import { AllCardDefinitions, CardDefinitionsByType } from '../cards';
	import { tick, type Component } from 'svelte';
	import type { CardDefinition, CreationModalComponentProps } from '../cards/types';
	import { dev } from '$app/environment';
	import { setIsCoarse, setIsMobile, setSelectedCardId, setSelectCard } from './context';
	import BaseEditingCard from '../cards/BaseCard/BaseEditingCard.svelte';
	import Context from './Context.svelte';
	import Head from './Head.svelte';
	import Account from './Account.svelte';
	import { SelectThemePopover } from '$lib/components/select-theme';
	import EditBar from './EditBar.svelte';
	import SaveModal from './SaveModal.svelte';
	import FloatingEditButton from './FloatingEditButton.svelte';
	import { user, resolveHandle, listRecords, getCDNImageBlobUrl } from '$lib/atproto';
	import * as TID from '@atcute/tid';
	import { launchConfetti } from '@foxui/visual';
	import Controls from './Controls.svelte';
	import CardCommand from '$lib/components/card-command/CardCommand.svelte';
	import { shouldMirror, mirrorLayout } from './layout-mirror';
	import { SvelteMap } from 'svelte/reactivity';

	let {
		data
	}: {
		data: WebsiteData;
	} = $props();

	// Check if floating login button will be visible (to hide MadeWithBlento)
	const showLoginOnEditPage = $derived(!user.isInitializing && !user.isLoggedIn);

	function updateTheme(newAccent: string, newBase: string) {
		data.publication.preferences ??= {};
		data.publication.preferences.accentColor = newAccent;
		data.publication.preferences.baseColor = newBase;
		data = { ...data };
	}

	let imageDragOver = $state(false);

	// svelte-ignore state_referenced_locally
	let items: Item[] = $state(data.cards);

	// svelte-ignore state_referenced_locally
	let publication = $state(JSON.stringify(data.publication));

	// Track saved state for comparison
	// svelte-ignore state_referenced_locally
	let savedItems = $state(JSON.stringify(data.cards));
	// svelte-ignore state_referenced_locally
	let savedPublication = $state(JSON.stringify(data.publication));

	let hasUnsavedChanges = $derived(
		JSON.stringify(items) !== savedItems || JSON.stringify(data.publication) !== savedPublication
	);

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
	let showMobileWarning = $state((innerWidth.current ?? 1000) < 1024);

	setIsMobile(() => isMobile);

	// svelte-ignore state_referenced_locally
	let editedOn = $state(data.publication.preferences?.editedOn ?? 0);

	function onLayoutChanged() {
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

	function getViewportCenterGridY(): { gridY: number; isMobile: boolean } | undefined {
		if (!container) return undefined;
		const rect = container.getBoundingClientRect();
		const currentMargin = isMobile ? mobileMargin : margin;
		const cellSize = (rect.width - currentMargin * 2) / COLUMNS;
		const viewportCenterY = window.innerHeight / 2;
		const gridY = (viewportCenterY - rect.top - currentMargin) / cellSize;
		return { gridY, isMobile };
	}

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
			for (const el of document.querySelectorAll(
				'[data-dialog-overlay], [data-dialog-content]'
			)) {
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

		const viewportCenter = getViewportCenterGridY();
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

		scrollToItem(item, isMobile, container);
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

			// Update saved state
			savedItems = JSON.stringify(items);
			savedPublication = JSON.stringify(data.publication);

			saveSuccess = true;

			launchConfetti();

			// Refresh cached data
			await fetch('/' + data.handle + '/api/refresh');
		} catch (error) {
			console.log(error);
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

			fixAllCollisions(copiedCards);
			fixAllCollisions(copiedCards, true);
			compactItems(copiedCards);
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

	let debugPoint = $state({ x: 0, y: 0 });

	function getGridPosition(
		clientX: number,
		clientY: number
	):
		| { x: number; y: number; swapWithId: string | null; placement: 'above' | 'below' | null }
		| undefined {
		if (!container || !activeDragElement.item) return;

		// x, y represent the top-left corner of the dragged card
		const x = clientX + activeDragElement.mouseDeltaX;
		const y = clientY + activeDragElement.mouseDeltaY;

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

	function getDragXY(
		e: DragEvent & {
			currentTarget: EventTarget & HTMLDivElement;
		}
	) {
		return getGridPosition(e.clientX, e.clientY);
	}

	// Touch drag system (instant drag on selected card)
	let touchDragActive = $state(false);

	function touchStart(e: TouchEvent) {
		if (!selectedCardId || !container) return;
		const touch = e.touches[0];
		if (!touch) return;

		// Check if the touch is on the selected card element
		const target = (e.target as HTMLElement)?.closest?.('.card');
		if (!target || target.id !== selectedCardId) return;

		const item = items.find((i) => i.id === selectedCardId);
		if (!item || item.cardData?.locked) return;

		// Start dragging immediately
		touchDragActive = true;

		const cardEl = container.querySelector(`#${CSS.escape(selectedCardId)}`) as HTMLDivElement;
		if (!cardEl) return;

		activeDragElement.element = cardEl;
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

		const rect = cardEl.getBoundingClientRect();
		activeDragElement.mouseDeltaX = rect.left - touch.clientX;
		activeDragElement.mouseDeltaY = rect.top - touch.clientY;
	}

	function touchMove(e: TouchEvent) {
		if (!touchDragActive) return;

		const touch = e.touches[0];
		if (!touch) return;

		e.preventDefault();

		const result = getGridPosition(touch.clientX, touch.clientY);
		if (!result || !activeDragElement.item) return;

		const draggedOrigPos = activeDragElement.originalPositions.get(activeDragElement.item.id);

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
				if (isMobile) {
					swapTarget.mobileX = draggedOrigPos.mobileX;
					swapTarget.mobileY = draggedOrigPos.mobileY;
				} else {
					swapTarget.x = draggedOrigPos.x;
					swapTarget.y = draggedOrigPos.y;
				}
			}
		}

		fixCollisions(items, activeDragElement.item, isMobile);

		// Auto-scroll near edges
		const scrollZone = 100;
		const scrollSpeed = 10;
		const viewportHeight = window.innerHeight;

		if (touch.clientY < scrollZone) {
			const intensity = 1 - touch.clientY / scrollZone;
			window.scrollBy(0, -scrollSpeed * intensity);
		} else if (touch.clientY > viewportHeight - scrollZone) {
			const intensity = 1 - (viewportHeight - touch.clientY) / scrollZone;
			window.scrollBy(0, scrollSpeed * intensity);
		}
	}

	function touchEnd() {
		if (touchDragActive && activeDragElement.item) {
			// Finalize position
			fixCollisions(items, activeDragElement.item, isMobile);
			onLayoutChanged();

			activeDragElement.x = -1;
			activeDragElement.y = -1;
			activeDragElement.element = null;
			activeDragElement.item = null;
			activeDragElement.lastTargetId = null;
			activeDragElement.lastPlacement = null;
		}

		touchDragActive = false;
	}

	// Only register non-passive touchmove when actively dragging
	$effect(() => {
		const el = container;
		if (!touchDragActive || !el) return;

		el.addEventListener('touchmove', touchMove, { passive: false });
		return () => {
			el.removeEventListener('touchmove', touchMove);
		};
	});

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
			const viewportCenter = getViewportCenterGridY();
			setPositionOfNewItem(item, items, viewportCenter);
			items = [...items, item];
			fixCollisions(items, item, false, true);
			fixCollisions(items, item, true, true);
			compactItems(items, false);
			compactItems(items, true);
		}

		onLayoutChanged();

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

		for (let i = 0; i < imageFiles.length; i++) {
			// First image gets the drop position, rest use normal placement
			if (i === 0) {
				await processImageFile(imageFiles[i], gridX, gridY);
			} else {
				await processImageFile(imageFiles[i]);
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

		const viewportCenter = getViewportCenterGridY();
		setPositionOfNewItem(item, items, viewportCenter);
		items = [...items, item];
		fixCollisions(items, item, false, true);
		fixCollisions(items, item, true, true);
		compactItems(items, false);
		compactItems(items, true);

		onLayoutChanged();

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

<svelte:window
	ondragover={handleImageDragOver}
	ondragleave={handleImageDragLeave}
	ondrop={handleImageDrop}
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
			<!-- svelte-ignore a11y_no_static_element_interactions a11y_click_events_have_key_events -->
			<div
				bind:this={container}
				onclick={(e) => {
					// Deselect when tapping empty grid space
					if (e.target === e.currentTarget || !(e.target as HTMLElement)?.closest?.('.card')) {
						selectedCardId = null;
					}
				}}
				ontouchstart={touchStart}
				ontouchend={touchEnd}
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
					// safari fix
					activeDragElement.x = -1;
					activeDragElement.y = -1;
					activeDragElement.element = null;
					activeDragElement.item = null;
					activeDragElement.lastTargetId = null;
					activeDragElement.lastPlacement = null;
					return true;
				}}
				class={[
					'@container/grid pointer-events-auto relative col-span-3 rounded-4xl px-2 py-8 @5xl/wrapper:px-8',
					imageDragOver && 'outline-accent-500 outline-3 -outline-offset-10 outline-dashed'
				]}
			>
				{#each items as item, i (item.id)}
					<!-- {#if item !== activeDragElement.item} -->
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
						ondragstart={(e: DragEvent) => {
							const target = e.currentTarget as HTMLDivElement;
							activeDragElement.element = target;
							activeDragElement.w = item.w;
							activeDragElement.h = item.h;
							activeDragElement.item = item;
							// fix for div shadow during drag and drop
							const transparent = document.createElement('div');
							transparent.style.position = 'fixed';
							transparent.style.top = '-1000px';
							transparent.style.width = '1px';
							transparent.style.height = '1px';
							document.body.appendChild(transparent);
							e.dataTransfer?.setDragImage(transparent, 0, 0);
							requestAnimationFrame(() => transparent.remove());

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
