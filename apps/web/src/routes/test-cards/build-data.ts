import { COLUMNS } from '$lib';
import { AllCardDefinitions, CardDefinitionsByType } from '$lib/cards';
import { fixAllCollisions, compactItems } from '$lib/layout';
import type { Item, SectionRecord, WebsiteData } from '$lib/types';
import { createEmptyCard } from '$lib/helpers/items';
import * as TID from '@atcute/tid';
import type { Did } from '@atcute/lexicons';
import type { AppBskyActorDefs } from '@atcute/bluesky';

// All cards point at this real PDS so any card that pulls data from the
// page's DID (atprotocollections, npmxLikes, margin, rpgActor, kichRecipe…)
// shows real data without hand-fed records.
const TEST_DID = 'did:plc:257wekqxg4hyapkq6k47igmp' as Did;
const TEST_HANDLE = 'flo-bit.dev';

// Categories rendered top-to-bottom. Cards without a group fall into "Other".
const CATEGORY_ORDER = [
	'Core',
	'Sections',
	'Content',
	'Utilities',
	'Visual',
	'Games',
	'Media',
	'Social',
	'Other'
] as const;

// Hand-picked test data for card types where the default is not enough.
// Anything not listed falls back to whatever `createNew` produces.
const CARD_DATA_PRESETS: Record<string, (data: Record<string, unknown>) => void> = {
	link: (d) => {
		d.href = 'https://blento.app';
		d.domain = 'blento.app';
		d.label = 'Blento';
		d.title = 'Blento';
		d.description = 'Bluesky-powered bento grid websites.';
		d.hasFetched = true;
	},
	image: (d) => {
		d.image = 'https://picsum.photos/seed/blento/800/800';
		d.alt = 'Random sample image';
	},
	mapLocation: (d) => {
		// Berlin
		d.lat = '52.5200';
		d.lon = '13.4050';
		d.name = 'Berlin';
		d.type = 'city';
		d.zoom = 10;
	},
	button: (d) => {
		d.text = 'Click me';
		d.href = 'https://blento.app';
	},
	countdown: (d) => {
		const year = new Date().getUTCFullYear() + 1;
		d.targetDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0)).toISOString();
		d.label = `New Year ${year}`;
	},
	statusphere: (d) => {
		d.mode = 'emoji';
		d.emoji = '👋';
	},
	'fluid-text': (d) => {
		d.text = 'FLUID';
	},
	githubProfile: (d) => {
		d.user = 'flo-bit';
		d.href = 'https://github.com/flo-bit';
	},
	githubContributors: (d) => {
		d.owner = 'sveltejs';
		d.repo = 'svelte';
	},
	bigsocial: (d) => {
		d.platform = 'bluesky';
		d.href = 'https://bsky.app';
	},
	blueskyPost: (d) => {
		d.uri = 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3l6oveex3ii2l';
		d.href = 'https://bsky.app/profile/bsky.app/post/3l6oveex3ii2l';
	},
	blueskyProfile: (d) => {
		d.handle = 'bsky.app';
		d.displayName = 'Bluesky';
		d.avatar =
			'https://cdn.bsky.app/img/avatar/plain/did:plc:z72i7hdynmk6r22z27h6tvur/bafkreih6cqcioehosbf2pikllesmegjxopcljpwcvwsskosygi6umm6kuq@jpeg';
	},
	blueskyFeed: (d) => {
		d.handle = 'bsky.app';
		d.did = 'did:plc:z72i7hdynmk6r22z27h6tvur';
	},
	latestPost: (d) => {
		d.label = 'Latest bluesky post';
	},
	friends: (d) => {
		d.friends = ['did:plc:z72i7hdynmk6r22z27h6tvur'];
	},
	blueskyMedia: (d) => {
		d.image = {
			fullsize: 'https://picsum.photos/seed/blueskymedia/800/800',
			thumbnail: 'https://picsum.photos/seed/blueskymedia/400/400',
			alt: 'Bluesky media placeholder'
		};
		d.href = 'https://bsky.app/profile/flo-bit.dev/post/3mlf4zqebms2t';
	},
	'grain-gallery': (d) => {
		d.galleryUri = 'at://did:plc:z5efhtji4vfiutzqquvx3w7o/social.grain.gallery/3mkstfoquxv2m';
		d.href = 'https://grain.social/profile/did:plc:z5efhtji4vfiutzqquvx3w7o/gallery/3mkstfoquxv2m';
	},
	latestLivestream: (d) => {
		d.href = 'https://stream.place/rtareview.stream';
	},
	livestreamEmbed: (d) => {
		d.href = 'https://stream.place/rtareview.stream';
		d.embed = 'https://stream.place/embed/rtareview.stream';
	},
	producthunt: (d) => {
		d.imageSrc =
			'https://api.producthunt.com/widgets/embed-image/v1/product_rating.svg?product_id=1097839&theme=light';
		d.linkHref =
			'https://www.producthunt.com/products/graphbit/reviews?utm_source=badge-product_rating&utm_medium=badge&utm_source=badge-graphbit';
	},
	kickstarter: (d) => {
		d.src = 'https://www.kickstarter.com/projects/wraithmarked/hitchhikers/widget/card.html?v=2';
		d.widgetType = 'card';
	},
	event: (d) => {
		d.uri = 'at://did:plc:257wekqxg4hyapkq6k47igmp/community.lexicon.calendar.event/3mlloxhxtmcxh';
	},
	'plyr-fm': (d) => {
		d.href = 'https://plyr.fm/embed/track/976';
	},
	'plyr-fm-collection': (d) => {
		// User gave a profile URL, not an album/playlist. Use the user's profile URL anyway —
		// PlyrFM will likely render an error iframe, but the card itself shouldn't crash.
		d.href = 'https://plyr.fm/u/eurocity.band';
	},
	recentTealFMPlays: (d) => {
		d.handle = 'flo-bit.dev';
	},
	recentRockskyPlays: (d) => {
		d.handle = 'flo-bit.dev';
	},
	vcard: (d) => {
		d.vcard = [
			'BEGIN:VCARD',
			'VERSION:3.0',
			'N:Tester;Card;;;',
			'FN:Card Tester',
			'ORG:Blento',
			'TITLE:Test Page',
			'URL:https://blento.app',
			'END:VCARD'
		].join('\n');
	},
	youtubeVideo: (d) => {
		d.youtubeId = 'dQw4w9WgXcQ';
		d.href = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
		d.poster = 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg';
		d.showInline = false;
	},
	'spotify-list-embed': (d) => {
		d.spotifyType = 'track';
		d.spotifyId = '4cOdK2wGLETKBW3PvgPWqT';
		d.href = 'https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT';
	},
	'apple-music-embed': (d) => {
		d.appleMusicStorefront = 'us';
		d.appleMusicType = 'album';
		d.appleMusicId = '1440857781';
		d.href = 'https://music.apple.com/us/album/1440857781';
	},
	'soundcloud-embed': (d) => {
		d.href = 'https://soundcloud.com/forss/flickermood';
	},
	gif: (d) => {
		d.url = 'https://media.giphy.com/media/dzaUX7CAG0Ihi/giphy.mp4';
		d.alt = 'Test GIF';
	},
	lastfmRecentTracks: (d) => {
		d.lastfmUsername = 'rj';
	},
	lastfmTopTracks: (d) => {
		d.lastfmUsername = 'rj';
		d.period = '7day';
	},
	lastfmTopAlbums: (d) => {
		d.lastfmUsername = 'rj';
		d.period = '7day';
	},
	lastfmProfile: (d) => {
		d.lastfmUsername = 'rj';
	},
	listenbrainzRecentListens: (d) => {
		d.username = 'rob';
	},
	listenbrainzTopArtists: (d) => {
		d.username = 'rob';
	},
	listenbrainzTopAlbums: (d) => {
		d.username = 'rob';
	},
	listenbrainzTopSongs: (d) => {
		d.username = 'rob';
	},
	listenbrainzNowPlaying: (d) => {
		d.username = 'rob';
	}
};

function buildHeadingCard(page: string, sectionId: string, title: string): Item {
	const card = createEmptyCard(page, sectionId);
	card.cardType = 'section';
	card.cardData = {
		text: title,
		verticalAlign: 'bottom',
		textSize: 1
	};
	card.w = COLUMNS;
	card.h = 1;
	card.mobileW = COLUMNS;
	card.mobileH = 1;
	card.x = 0;
	card.y = 0;
	card.mobileX = 0;
	card.mobileY = 0;
	card.version = 2;
	return card;
}

export function buildTestData(): WebsiteData {
	const page = 'blento.self';
	const sectionId = TID.now();

	const section: SectionRecord = {
		id: sectionId,
		sectionType: 'grid',
		page,
		index: 0,
		sectionData: {},
		version: 1
	};

	// Bucket cards by category, preserving order from AllCardDefinitions.
	const buckets = new Map<string, (typeof AllCardDefinitions)[number][]>();
	for (const def of AllCardDefinitions) {
		if (def.type === 'section') continue;
		const category = (def.groups?.[0] as string | undefined) ?? 'Other';
		const bucket = buckets.get(category) ?? [];
		bucket.push(def);
		buckets.set(category, bucket);
	}

	const orderedCategories = [
		...CATEGORY_ORDER.filter((c) => buckets.has(c)),
		...[...buckets.keys()].filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c))
	];

	const cards: Item[] = [];

	for (const category of orderedCategories) {
		const defs = buckets.get(category);
		if (!defs?.length) continue;

		cards.push(buildHeadingCard(page, sectionId, category));

		for (const def of defs) {
			const card = createEmptyCard(page, sectionId);
			card.cardType = def.type;
			def.createNew?.(card);

			const preset = CARD_DATA_PRESETS[def.type];
			if (preset) preset(card.cardData ?? (card.cardData = {}));

			const w = Math.max(card.w, def.minW ?? 2);
			const h = Math.max(card.h, def.minH ?? 2);
			card.w = Math.min(w, def.maxW ?? COLUMNS);
			card.h = Math.min(h, def.maxH ?? 16);
			card.mobileW = Math.max(card.mobileW, Math.min(card.w * 2, COLUMNS));
			card.mobileH = Math.max(card.mobileH, card.h);

			card.x = 0;
			card.y = 0;
			card.mobileX = 0;
			card.mobileY = 0;
			card.version = 2;

			cards.push(card);
		}
	}

	fixAllCollisions(cards, false);
	fixAllCollisions(cards, true);
	compactItems(cards, false);
	compactItems(cards, true);

	const profile: AppBskyActorDefs.ProfileViewDetailed = {
		did: TEST_DID,
		handle: TEST_HANDLE as `${string}.${string}`,
		displayName: 'Card Test Page',
		description: 'Every card type, rendered against flo-bit.dev for live data.'
	};

	return {
		page,
		did: TEST_DID,
		handle: TEST_HANDLE,
		cards,
		sections: [section],
		publication: {
			name: 'Card Test Page',
			description: 'Every card type, rendered against flo-bit.dev for live data.'
		},
		additionalData: {},
		profile,
		updatedAt: Date.now(),
		version: 1
	};
}

/**
 * Populate `data.additionalData` by invoking each card type's `loadData`
 * client-side. We can't run `loadDataServer` here (needs platform/env), so
 * cards that only define server loaders will appear empty.
 */
export async function loadAllAdditionalData(data: WebsiteData): Promise<void> {
	const cardTypes = new Set(data.cards.map((c) => c.cardType));
	await Promise.all(
		[...cardTypes].map(async (cardType) => {
			const cardDef = CardDefinitionsByType[cardType];
			if (!cardDef?.loadData) return;
			const items = data.cards.filter((c) => c.cardType === cardType);
			try {
				const result = await cardDef.loadData(items, {
					did: data.did as Did,
					handle: data.handle
				});
				data.additionalData[cardType] = result;
			} catch (err) {
				console.error('test-cards: loadData failed for', cardType, err);
			}
		})
	);
}
