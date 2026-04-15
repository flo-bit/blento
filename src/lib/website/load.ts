import { getDetailedProfile, listRecords, resolveHandle, parseUri, getRecord } from '$lib/atproto';
import { CardDefinitionsByType } from '$lib/cards';
import type { CacheService } from '$lib/cache';
import { createEmptyCard } from '$lib/helper';
import type { Item, PronounsRecord, WebsiteData } from '$lib/types';
import { error } from '@sveltejs/kit';
import type { ActorIdentifier, Did } from '@atcute/lexicons';

import { isDid, isHandle } from '@atcute/lexicons/syntax';
import { fixAllCollisions, compactItems, hasOverlaps } from '$lib/layout';

const CURRENT_CACHE_VERSION = 1;

function formatPronouns(
	record: PronounsRecord | undefined,
	profile: WebsiteData['profile'] | undefined
): string | undefined {
	// nearhorizon.actor.pronouns - https://github.com/skydeval/atproto-pronouns
	if (record?.value?.sets?.length) {
		const sets = record.value.sets;
		const displayMode = record.value.displayMode ?? 'all';
		const setsToShow = displayMode === 'firstOnly' ? sets.slice(0, 1) : sets;
		return setsToShow.map((s) => s.forms.join('/')).join(' · ');
	}
	// fallback to bsky pronouns
	const pronouns = (profile as Record<string, unknown>)?.pronouns;
	if (pronouns && typeof pronouns === 'string') return pronouns;
	return undefined;
}

export async function getCache(identifier: ActorIdentifier, page: string, cache?: CacheService) {
	try {
		const cachedResult = await cache?.getBlento(identifier);

		if (!cachedResult) return;
		const result = JSON.parse(cachedResult);

		if (!result.version || result.version !== CURRENT_CACHE_VERSION) {
			console.log('skipping cache because of version mismatch');
			return;
		}

		result.page = 'blento.' + page;

		result.publication = (result.publications as Awaited<ReturnType<typeof listRecords>>).find(
			(v) => parseUri(v.uri)?.rkey === result.page
		)?.value;
		result.publication ??= {
			name: result.profile?.displayName || result.profile?.handle,
			description: result.profile?.description
		};

		delete result['publications'];

		return checkData(result);
	} catch (error) {
		console.log('getting cached result failed', error);
	}
}

export async function loadData(
	handle: ActorIdentifier,
	cache: CacheService | undefined,
	forceUpdate: boolean = false,
	page: string = 'self',
	env?: Record<string, string | undefined>
): Promise<WebsiteData> {
	if (!handle) throw error(404);
	if (handle === 'favicon.ico') throw error(404);

	if (!forceUpdate) {
		const cachedResult = await getCache(handle, page, cache);

		if (cachedResult) return cachedResult;
	}

	let did: Did | undefined = undefined;
	if (isHandle(handle)) {
		did = await resolveHandle({ handle });
	} else if (isDid(handle)) {
		did = handle;
	} else {
		throw error(404);
	}

	const [cards, mainPublication, pages, profile, pronounsRecord] = await Promise.all([
		listRecords({ did, collection: 'app.blento.card', limit: 0 }).catch((e) => {
			console.error('error getting records for collection app.blento.card', e);
			return [] as Awaited<ReturnType<typeof listRecords>>;
		}),
		getRecord({
			did,
			collection: 'site.standard.publication',
			rkey: 'blento.self'
		}).catch(() => {
			console.error('error getting record for collection site.standard.publication');
			return undefined;
		}),
		listRecords({ did, collection: 'app.blento.page' }).catch(() => {
			console.error('error getting records for collection app.blento.page');
			return [] as Awaited<ReturnType<typeof listRecords>>;
		}),
		getDetailedProfile({ did }),
		getRecord({
			did,
			collection: 'app.nearhorizon.actor.pronouns',
			rkey: 'self'
		}).catch(() => undefined)
	]);

	const additionalData = await loadAdditionalData(
		cards.map((v) => ({ ...v.value })) as Item[],
		{ did, handle, cache },
		env
	);

	const result = {
		page: 'blento.' + page,
		handle,
		did,
		cards: (cards.map((v) => {
			return { ...v.value };
		}) ?? []) as Item[],
		publications: [mainPublication, ...pages].filter((v) => v),
		additionalData,
		profile,
		pronouns: formatPronouns(pronounsRecord, profile),
		pronounsRecord: pronounsRecord as PronounsRecord | undefined,
		updatedAt: Date.now(),
		version: CURRENT_CACHE_VERSION
	};

	// Only cache results that have cards to avoid caching PDS errors
	if (result.cards.length > 0) {
		const stringifiedResult = JSON.stringify(result);
		await cache?.putBlento(did, handle as string, stringifiedResult);
	}

	const parsedResult = structuredClone(result) as any;

	parsedResult.publication = (
		parsedResult.publications as Awaited<ReturnType<typeof listRecords>>
	).find((v) => parseUri(v.uri)?.rkey === parsedResult.page)?.value;
	parsedResult.publication ??= {
		name: profile?.displayName || profile?.handle,
		description: profile?.description
	};

	delete parsedResult['publications'];

	return checkData(parsedResult);
}

export async function loadCardData(
	handle: ActorIdentifier,
	rkey: string,
	cache: CacheService | undefined,
	env?: Record<string, string | undefined>
): Promise<WebsiteData> {
	if (!handle) throw error(404);
	if (handle === 'favicon.ico') throw error(404);

	let did: Did | undefined = undefined;
	if (isHandle(handle)) {
		did = await resolveHandle({ handle });
	} else if (isDid(handle)) {
		did = handle;
	} else {
		throw error(404);
	}

	const [cardRecord, profile, pronounsRecord] = await Promise.all([
		getRecord({
			did,
			collection: 'app.blento.card',
			rkey
		}).catch(() => undefined),
		getDetailedProfile({ did }),
		getRecord({
			did,
			collection: 'app.nearhorizon.actor.pronouns',
			rkey: 'self'
		}).catch(() => undefined)
	]);

	if (!cardRecord?.value) {
		throw error(404, 'Card not found');
	}

	const card = migrateCard(structuredClone(cardRecord.value) as Item);
	const page = card.page ?? 'blento.self';

	const publication = await getRecord({
		did,
		collection: page === 'blento.self' ? 'site.standard.publication' : 'app.blento.page',
		rkey: page
	}).catch(() => undefined);

	const cards = [card];
	const resolvedHandle = profile?.handle || (isHandle(handle) ? handle : did);

	const additionalData = await loadAdditionalData(
		cards,
		{ did, handle: resolvedHandle, cache },
		env
	);

	const result = {
		page,
		handle: resolvedHandle,
		did,
		cards,
		publication:
			publication?.value ??
			({
				name: profile?.displayName || profile?.handle,
				description: profile?.description
			} as WebsiteData['publication']),
		additionalData,
		profile,
		pronouns: formatPronouns(pronounsRecord, profile),
		pronounsRecord: pronounsRecord as PronounsRecord | undefined,
		updatedAt: Date.now(),
		version: CURRENT_CACHE_VERSION
	};

	return result;
}

export async function loadCardTypeData(
	handle: ActorIdentifier,
	type: string,
	cardData: Record<string, unknown>,
	cache: CacheService | undefined,
	env?: Record<string, string | undefined>
): Promise<WebsiteData> {
	if (!handle) throw error(404);
	if (handle === 'favicon.ico') throw error(404);

	const cardDef = CardDefinitionsByType[type];
	if (!cardDef) {
		throw error(404, 'Card type not found');
	}

	let did: Did | undefined = undefined;
	if (isHandle(handle)) {
		did = await resolveHandle({ handle });
	} else if (isDid(handle)) {
		did = handle;
	} else {
		throw error(404);
	}

	const [publication, profile, pronounsRecord] = await Promise.all([
		getRecord({
			did,
			collection: 'site.standard.publication',
			rkey: 'blento.self'
		}).catch(() => undefined),
		getDetailedProfile({ did }),
		getRecord({
			did,
			collection: 'app.nearhorizon.actor.pronouns',
			rkey: 'self'
		}).catch(() => undefined)
	]);

	const card = createEmptyCard('blento.self');
	card.cardType = type;

	cardDef.createNew?.(card);
	card.cardData = {
		...card.cardData,
		...cardData
	};

	const cards = [card];
	const resolvedHandle = profile?.handle || (isHandle(handle) ? handle : did);

	const additionalData = await loadAdditionalData(
		cards,
		{ did, handle: resolvedHandle, cache },
		env
	);

	const result = {
		page: 'blento.self',
		handle: resolvedHandle,
		did,
		cards,
		publication:
			publication?.value ??
			({
				name: profile?.displayName || profile?.handle,
				description: profile?.description
			} as WebsiteData['publication']),
		additionalData,
		profile,
		pronouns: formatPronouns(pronounsRecord, profile),
		pronounsRecord: pronounsRecord as PronounsRecord | undefined,
		updatedAt: Date.now(),
		version: CURRENT_CACHE_VERSION
	};

	return checkData(result);
}

function migrateCard(card: Item): Item {
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

	if (!card.version || card.version < 2) {
		card.page = 'blento.self';
		card.version = 2;
	}

	const cardDef = CardDefinitionsByType[card.cardType];
	cardDef?.migrate?.(card);

	return card;
}

async function loadAdditionalData(
	cards: Item[],
	{ did, handle, cache }: { did: Did; handle: string; cache?: CacheService },
	env?: Record<string, string | undefined>
) {
	const cardTypes = new Set(cards.map((v) => v.cardType ?? '') as string[]);
	const cardTypesArray = Array.from(cardTypes);
	const additionDataPromises: Record<string, Promise<unknown>> = {};

	for (const cardType of cardTypesArray) {
		const cardDef = CardDefinitionsByType[cardType];
		const items = cards.filter((v) => cardType === v.cardType);

		try {
			if (cardDef?.loadDataServer) {
				additionDataPromises[cardType] = cardDef.loadDataServer(items, {
					did,
					handle,
					cache,
					env
				});
			} else if (cardDef?.loadData) {
				additionDataPromises[cardType] = cardDef.loadData(items, { did, handle, cache });
			}
		} catch {
			console.error('error getting additional data for', cardType);
		}
	}

	await Promise.all(Object.values(additionDataPromises));

	const additionalData: Record<string, unknown> = {};
	for (const [key, value] of Object.entries(additionDataPromises)) {
		try {
			additionalData[key] = await value;
		} catch (error) {
			console.log('error loading', key, error);
		}
	}

	return additionalData;
}

function checkData(data: WebsiteData): WebsiteData {
	data = migrateData(data);

	const cards = data.cards.filter((v) => v.page === data.page);

	if (cards.length > 0) {
		// Detect overlaps before fixing — flag is surfaced by the edit UI
		// so the user knows their layout was auto-adjusted.
		data.hasLayoutIssue = hasOverlaps(cards, false) || hasOverlaps(cards, true);

		fixAllCollisions(cards, false);
		fixAllCollisions(cards, true);
		compactItems(cards, false);
		compactItems(cards, true);
	}

	data.cards = cards;

	return data;
}

function migrateData(data: WebsiteData): WebsiteData {
	for (const card of data.cards) {
		migrateCard(card);
	}
	return data;
}
