import { getDetailedProfile, listRecords, resolveHandle, parseUri, getRecord } from '$lib/atproto';
import { getCDNImageBlobUrl } from '$lib/atproto/methods';
import { CardDefinitionsByType } from '$lib/cards';
import type { CacheService } from '$lib/cache';
import { createEmptyCard } from '$lib/helper';
import type { Item, PronounsRecord, WebsiteData } from '$lib/types';
import { error } from '@sveltejs/kit';
import type { ActorIdentifier, Did } from '@atcute/lexicons';

import type { D1Database } from '@cloudflare/workers-types';
import { isDid, isHandle } from '@atcute/lexicons/syntax';
import { fixAllCollisions, compactItems } from '$lib/layout';
import { getServerClient } from '$lib/contrail';
import type { AppBskyActorDefs } from '@atcute/bluesky';

function formatPronouns(
	record: PronounsRecord | undefined,
	profile: WebsiteData['profile'] | undefined
): string | undefined {
	if (record?.value?.sets?.length) {
		const sets = record.value.sets;
		const displayMode = record.value.displayMode ?? 'all';
		const setsToShow = displayMode === 'firstOnly' ? sets.slice(0, 1) : sets;
		return setsToShow.map((s) => s.forms.join('/')).join(' · ');
	}
	const pronouns = (profile as Record<string, unknown>)?.pronouns;
	if (pronouns && typeof pronouns === 'string') return pronouns;
	return undefined;
}

function resolveDid(handle: ActorIdentifier): Promise<Did | undefined> {
	if (isDid(handle)) return Promise.resolve(handle);
	if (isHandle(handle)) return resolveHandle({ handle });
	return Promise.resolve(undefined);
}

type ContrailProfile = {
	did: string;
	handle?: string;
	collection?: string;
	rkey?: string;
	record?: unknown;
};

/**
 * Extract a bsky-style profile and publication from contrail profile entries.
 */
function extractProfileData(
	did: string,
	profiles: ContrailProfile[]
): {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	publication: WebsiteData['publication'] | undefined;
} {
	let bskyRecord: Record<string, unknown> | undefined;
	let pubRecord: Record<string, unknown> | undefined;
	let handle = did;

	for (const p of profiles) {
		if (p.did !== did) continue;
		if (p.handle && p.handle !== 'handle.invalid') handle = p.handle;

		const record = p.record as Record<string, unknown> | undefined;
		if (p.collection === 'app.bsky.actor.profile' && record) {
			bskyRecord = record;
		}
		if (p.collection === 'site.standard.publication' && record) {
			pubRecord = record;
		}
	}

	const avatar = bskyRecord?.avatar
		? getCDNImageBlobUrl({
				did,
				blob: bskyRecord.avatar as { $type: 'blob'; ref: { $link: string } }
			})
		: undefined;

	const profile = {
		did: did as Did,
		handle: handle as `${string}.${string}`,
		displayName: (bskyRecord?.displayName as string) ?? handle,
		description: bskyRecord?.description as string | undefined,
		avatar
	} as AppBskyActorDefs.ProfileViewDetailed;

	const publication = pubRecord
		? (pubRecord as WebsiteData['publication'])
		: undefined;

	return { profile, publication };
}

/**
 * Load all data for a user from Contrail in a single call (cards + profiles).
 */
async function loadFromContrail(
	actor: ActorIdentifier,
	db: D1Database
): Promise<{
	cards: Item[];
	pages: Awaited<ReturnType<typeof listRecords>>;
	profiles: ContrailProfile[];
} | null> {
	try {
		const client = getServerClient(db);
		const [cardRes, pageRes] = await Promise.all([
			client.get('app.blento.card.listRecords', {
				params: { actor, limit: 200, profiles: true }
			}),
			client.get('app.blento.page.listRecords', {
				params: { actor, limit: 200 }
			})
		]);

		if (!cardRes.ok) return null;

		const cards = cardRes.data.records.map((r) => ({ ...(r.record as object) }) as Item);

		const pages = pageRes.ok
			? pageRes.data.records
					.filter((r) => r.record)
					.map((r) => ({
						uri: r.uri,
						cid: r.cid ?? '',
						value: r.record as Record<string, unknown>
					}))
			: [];

		return {
			cards,
			pages,
			profiles: (cardRes.data.profiles ?? []) as ContrailProfile[]
		};
	} catch (e) {
		console.error('Contrail query failed', e);
		return null;
	}
}

export async function loadData(
	handle: ActorIdentifier,
	cache: CacheService | undefined,
	forceUpdate: boolean = false,
	page: string = 'self',
	env?: Record<string, string | undefined>,
	platform?: App.Platform
): Promise<WebsiteData> {
	if (!handle) throw error(404);
	if (handle === 'favicon.ico') throw error(404);

	const did = await resolveDid(handle);
	if (!did) throw error(404);

	const db = platform?.env?.DB;
	const contrailData = db ? await loadFromContrail(handle, db) : null;

	let cards: Item[];
	let pageRecords: Awaited<ReturnType<typeof listRecords>>;
	let profile: WebsiteData['profile'];
	let publication: WebsiteData['publication'] | undefined;
	let pronounsRecord: PronounsRecord | undefined;

	if (contrailData) {
		cards = contrailData.cards;
		pageRecords = contrailData.pages;

		const extracted = extractProfileData(did, contrailData.profiles);
		profile = extracted.profile;
		publication = extracted.publication;

		// Pronouns still from PDS (not in contrail)
		pronounsRecord = await getRecord({
			did,
			collection: 'app.nearhorizon.actor.pronouns',
			rkey: 'self'
		}).catch(() => undefined) as PronounsRecord | undefined;
	} else {
		// Fallback: no D1 available (e.g. vite dev) — use PDS directly
		const [cardRecords, pageRecs, mainPub, prof, pronouns] = await Promise.all([
			listRecords({ did, collection: 'app.blento.card', limit: 0 }).catch((e) => {
				console.error('error getting records for collection app.blento.card', e);
				return [] as Awaited<ReturnType<typeof listRecords>>;
			}),
			listRecords({ did, collection: 'app.blento.page' }).catch(() => {
				return [] as Awaited<ReturnType<typeof listRecords>>;
			}),
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

		cards = cardRecords.map((v) => ({ ...v.value }) as Item);
		pageRecords = pageRecs;
		profile = prof;
		publication = mainPub?.value as WebsiteData['publication'] | undefined;
		pronounsRecord = pronouns as PronounsRecord | undefined;
	}

	// If no publication found from contrail profiles, check page records
	if (!publication) {
		const pubFromPages = pageRecords.find(
			(v) => parseUri(v.uri)?.rkey === 'blento.' + page
		);
		publication = pubFromPages?.value as WebsiteData['publication'] | undefined;
	}

	publication ??= {
		name: profile?.displayName || profile?.handle,
		description: profile?.description
	} as WebsiteData['publication'];

	const additionalData = await loadAdditionalData(
		cards,
		{ did, handle, cache, platform },
		env
	);

	return checkData({
		page: 'blento.' + page,
		handle,
		did,
		cards,
		publication,
		additionalData,
		profile,
		pronouns: formatPronouns(pronounsRecord, profile),
		pronounsRecord,
		updatedAt: Date.now(),
		version: 1
	});
}

export async function loadCardData(
	handle: ActorIdentifier,
	rkey: string,
	cache: CacheService | undefined,
	env?: Record<string, string | undefined>
): Promise<WebsiteData> {
	if (!handle) throw error(404);
	if (handle === 'favicon.ico') throw error(404);

	const did = await resolveDid(handle);
	if (!did) throw error(404);

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

	return {
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
		version: 1
	};
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

	const did = await resolveDid(handle);
	if (!did) throw error(404);

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

	return checkData({
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
		version: 1
	});
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
	{
		did,
		handle,
		cache,
		platform
	}: { did: Did; handle: string; cache?: CacheService; platform?: App.Platform },
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
					env,
					platform
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
