import { getDetailedProfile, listRecords, resolveHandle, parseUri, getRecord } from '$lib/atproto';
import { CardDefinitionsByType } from '$lib/cards';
import type { Item, UserCache, WebsiteData } from '$lib/types';
import { compactItems, fixAllCollisions } from '$lib/helper';
import { error } from '@sveltejs/kit';
import type { ActorIdentifier, Did } from '@atcute/lexicons';

import { isDid, isHandle } from '@atcute/lexicons/syntax';

const CURRENT_CACHE_VERSION = 1;

export async function getCache(handle: string, page: string, cache?: UserCache) {
	try {
		const cachedResult = await cache?.get?.(handle);

		if (!cachedResult) return;
		const result = JSON.parse(cachedResult);
		const update = result.updatedAt;
		const timePassed = (Date.now() - update) / 1000;

		const ONE_DAY = 60 * 60 * 24;

		if (!result.version || result.version !== CURRENT_CACHE_VERSION) {
			console.log('skipping cache because of version mismatch');
			return;
		}

		if (timePassed > ONE_DAY) {
			console.log('skipping cache because of age');
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

		console.log('using cached result for handle', handle, 'last update', timePassed, 'seconds ago');
		return checkData(result);
	} catch (error) {
		console.log('getting cached result failed', error);
	}
}

export async function loadData(
	handle: ActorIdentifier,
	cache: UserCache | undefined,
	forceUpdate: boolean = false,
	page: string = 'self'
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

	const cards = await listRecords({ did, collection: 'app.blento.card' }).catch(() => {
		console.error('error getting records for collection app.blento.card');
		return [] as Awaited<ReturnType<typeof listRecords>>;
	});

	const mainPublication = await getRecord({
		did,
		collection: 'site.standard.publication',
		rkey: 'blento.self'
	}).catch(() => {
		console.error('error getting record for collection site.standard.publication');
		return undefined;
	});

	const pages = await listRecords({ did, collection: 'app.blento.page' }).catch(() => {
		console.error('error getting records for collection app.blento.page');
		return [] as Awaited<ReturnType<typeof listRecords>>;
	});

	const profile = await getDetailedProfile({ did });

	const cardTypes = new Set(cards.map((v) => v.value.cardType ?? '') as string[]);
	const cardTypesArray = Array.from(cardTypes);

	const additionDataPromises: Record<string, Promise<unknown>> = {};

	const loadOptions = { did, handle, cache };

	for (const cardType of cardTypesArray) {
		const cardDef = CardDefinitionsByType[cardType];

		if (!cardDef?.loadData) continue;

		try {
			additionDataPromises[cardType] = cardDef.loadData(
				cards.filter((v) => cardType === v.value.cardType).map((v) => v.value) as Item[],
				loadOptions
			);
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
		updatedAt: Date.now(),
		version: CURRENT_CACHE_VERSION
	};

	const stringifiedResult = JSON.stringify(result);
	await cache?.put?.(handle, stringifiedResult);

	const parsedResult = JSON.parse(stringifiedResult);

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

function migrateFromV0ToV1(data: WebsiteData): WebsiteData {
	for (const card of data.cards) {
		if (card.version) continue;
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

	return data;
}

function migrateFromV1ToV2(data: WebsiteData): WebsiteData {
	for (const card of data.cards) {
		if (!card.version || card.version < 2) {
			card.page = 'blento.self';
			card.version = 2;
		}
	}
	return data;
}

function migrateCards(data: WebsiteData): WebsiteData {
	for (const card of data.cards) {
		const cardDef = CardDefinitionsByType[card.cardType];

		if (!cardDef?.migrate) continue;

		cardDef.migrate(card);
	}
	return data;
}

function checkData(data: WebsiteData): WebsiteData {
	data = migrateData(data);

	const cards = data.cards.filter((v) => v.page === data.page);

	if (cards.length > 0) {
		fixAllCollisions(cards);
		fixAllCollisions(cards, true);

		compactItems(cards);
		compactItems(cards, true);
	}

	data.cards = cards;

	return data;
}

function migrateData(data: WebsiteData): WebsiteData {
	return migrateCards(migrateFromV1ToV2(migrateFromV0ToV1(data)));
}
