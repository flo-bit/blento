import { getDetailedProfile, listRecords, resolveHandle, parseUri, getRecord } from '$lib/atproto';
import { getCDNImageBlobUrl } from '$lib/atproto/methods';
import { CardDefinitionsByType } from '$lib/cards';
import type { CacheService } from '$lib/cache';
import { createEmptyCard } from '$lib/helper';
import type { Item, PronounsRecord, SectionRecord, WebsiteData } from '$lib/types';
import { ensureSections } from '$lib/sections/migrate';
import { error } from '@sveltejs/kit';
import type { ActorIdentifier, Did } from '@atcute/lexicons';

import type { D1Database } from '@cloudflare/workers-types';
import { isDid, isHandle } from '@atcute/lexicons/syntax';
import { fixAllCollisions, compactItems, hasOverlaps } from '$lib/layout';
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
 * Extract a bsky-style profile, publication, and pronouns from contrail profile entries.
 */
function extractProfileData(
	did: string,
	profiles: ContrailProfile[]
): {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	publication: WebsiteData['publication'] | undefined;
	pronounsRecord: PronounsRecord | undefined;
} {
	let bskyRecord: Record<string, unknown> | undefined;
	let pubRecord: Record<string, unknown> | undefined;
	let pronounsValue: Record<string, unknown> | undefined;
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
		if (p.collection === 'app.nearhorizon.actor.pronouns' && record) {
			pronounsValue = record;
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

	const publication = pubRecord ? (pubRecord as WebsiteData['publication']) : undefined;

	const pronounsRecord = pronounsValue ? ({ value: pronounsValue } as PronounsRecord) : undefined;

	return { profile, publication, pronounsRecord };
}

async function tryContrail<T>(label: string, fn: () => Promise<T | null>): Promise<T | null> {
	try {
		return await fn();
	} catch (e) {
		console.error(`Contrail ${label} failed`, e);
		return null;
	}
}

/**
 * Fetch only the profile bundle (bsky profile + publication + pronouns) from contrail.
 * Used by single-card routes that don't need the full card list.
 */
function loadProfilesFromContrail(actor: ActorIdentifier, db: D1Database) {
	return tryContrail('getProfile', async () => {
		const res = await getServerClient(db).get('app.blento.getProfile', { params: { actor } });
		if (!res.ok) return null;
		return (res.data.profiles ?? []) as ContrailProfile[];
	});
}

/**
 * Fetch a single card from contrail by DID + rkey.
 */
function loadCardFromContrail(did: Did, rkey: string, db: D1Database) {
	return tryContrail('card.getRecord', async () => {
		const uri = `at://${did}/app.blento.card/${rkey}` as const;
		const res = await getServerClient(db).get('app.blento.card.getRecord', {
			params: { uri }
		});
		if (!res.ok) return null;
		return { ...(res.data.record as object) } as Item;
	});
}

/**
 * Load cards for a single page + all pages for the actor from Contrail.
 * Filtering cards by page at query time means we only run additional-data loaders
 * for card types that actually appear on the current page.
 */
function loadFromContrail(actor: ActorIdentifier, db: D1Database, page: string) {
	return tryContrail('cards+pages+sections query', async () => {
		const client = getServerClient(db);
		const [cardRes, pageRes, sectionRes] = await Promise.all([
			client.get('app.blento.card.listRecords', {
				params: { actor, limit: 200, profiles: true, page }
			}),
			client.get('app.blento.page.listRecords', {
				params: { actor, limit: 200 }
			}),
			client.get('app.blento.section.listRecords' as any, {
				params: { actor, limit: 200, page }
			}) as Promise<any>
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

		const sections =
			sectionRes?.ok && sectionRes.data?.records
				? (sectionRes.data.records as any[]).map(
						(r: any) => ({ ...(r.record as object), id: parseUri(r.uri)?.rkey }) as SectionRecord
					)
				: [];

		return {
			cards,
			pages,
			sections,
			profiles: (cardRes.data.profiles ?? []) as ContrailProfile[]
		};
	});
}

function defaultPublication(
	profile: WebsiteData['profile'] | undefined
): WebsiteData['publication'] {
	return {
		name: profile?.displayName || profile?.handle,
		description: profile?.description
	} as WebsiteData['publication'];
}

function getPronounsFromPDS(did: Did) {
	return getRecord({
		did,
		collection: 'app.nearhorizon.actor.pronouns',
		rkey: 'self'
	}).catch(() => undefined) as Promise<PronounsRecord | undefined>;
}

function getSelfPublicationFromPDS(did: Did) {
	return getRecord({
		did,
		collection: 'site.standard.publication',
		rkey: 'blento.self'
	}).catch(() => undefined);
}

export async function loadData(
	handle: ActorIdentifier,
	cache: CacheService | undefined,
	page: string = 'self',
	env?: Record<string, string | undefined>,
	platform?: App.Platform
): Promise<WebsiteData> {
	if (!handle) throw error(404);
	if (handle === 'favicon.ico') throw error(404);

	const did = await resolveDid(handle);
	if (!did) throw error(404);

	const db = platform?.env?.DB;
	const fullPage = 'blento.' + page;
	const contrailData = db ? await loadFromContrail(handle, db, fullPage) : null;

	let cards: Item[];
	let sectionRecords: SectionRecord[] = [];
	let pageRecords: Awaited<ReturnType<typeof listRecords>>;
	let profile: WebsiteData['profile'];
	let publication: WebsiteData['publication'] | undefined;
	let pronounsRecord: PronounsRecord | undefined;

	if (contrailData) {
		cards = contrailData.cards;
		sectionRecords = contrailData.sections;
		pageRecords = contrailData.pages;

		const hasBskyProfile = contrailData.profiles.some(
			(p) => p.did === did && p.collection === 'app.bsky.actor.profile'
		);

		if (hasBskyProfile) {
			const extracted = extractProfileData(did, contrailData.profiles);
			profile = extracted.profile;
			publication = extracted.publication;
			pronounsRecord = extracted.pronounsRecord;
		} else {
			// Contrail didn't return profile data (e.g. no card records) — fetch from PDS
			const [prof, mainPub, pronouns] = await Promise.all([
				getDetailedProfile({ did }),
				getSelfPublicationFromPDS(did),
				getPronounsFromPDS(did)
			]);
			profile = prof;
			publication = mainPub?.value as WebsiteData['publication'] | undefined;
			pronounsRecord = pronouns;

			// Still extract publication/pronouns from contrail if available
			const extracted = extractProfileData(did, contrailData.profiles);
			if (!publication) publication = extracted.publication;
			if (!pronounsRecord) pronounsRecord = extracted.pronounsRecord;
		}
	} else {
		// Fallback: no D1 available (e.g. vite dev) — use PDS directly
		const [cardRecords, pageRecs, sectionRecs, mainPub, prof, pronouns] = await Promise.all([
			listRecords({ did, collection: 'app.blento.card', limit: 0 }).catch((e) => {
				console.error('error getting records for collection app.blento.card', e);
				return [] as Awaited<ReturnType<typeof listRecords>>;
			}),
			listRecords({ did, collection: 'app.blento.page' }).catch(
				() => [] as Awaited<ReturnType<typeof listRecords>>
			),
			listRecords({ did, collection: 'app.blento.section' }).catch(
				() => [] as Awaited<ReturnType<typeof listRecords>>
			),
			getSelfPublicationFromPDS(did),
			getDetailedProfile({ did }),
			getPronounsFromPDS(did)
		]);

		cards = cardRecords.map((v) => ({ ...v.value }) as Item);
		sectionRecords = sectionRecs
			.filter((v) => (v.value as any)?.page === fullPage)
			.map((v) => ({ ...(v.value as object), id: parseUri(v.uri)?.rkey }) as SectionRecord);
		pageRecords = pageRecs;
		profile = prof;
		publication = mainPub?.value as WebsiteData['publication'] | undefined;
		pronounsRecord = pronouns;
	}

	// If no publication found from contrail profiles, check page records
	if (!publication) {
		const pubFromPages = pageRecords.find((v) => parseUri(v.uri)?.rkey === 'blento.' + page);
		publication = pubFromPages?.value as WebsiteData['publication'] | undefined;
	}

	publication ??= defaultPublication(profile);

	const migrated = ensureSections(sectionRecords, cards, fullPage);

	const additionalData = await loadAdditionalData(
		migrated.cards,
		{ did, handle, cache, platform },
		env
	);

	return checkData({
		page: fullPage,
		handle,
		did,
		cards: migrated.cards,
		sections: migrated.sections,
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
	env?: Record<string, string | undefined>,
	platform?: App.Platform
): Promise<WebsiteData> {
	if (!handle) throw error(404);
	if (handle === 'favicon.ico') throw error(404);

	const did = await resolveDid(handle);
	if (!did) throw error(404);

	const db = platform?.env?.DB;

	let cardValue: Item | undefined;
	let profile: WebsiteData['profile'] | undefined;
	let publication: WebsiteData['publication'] | undefined;
	let pronounsRecord: PronounsRecord | undefined;

	if (db) {
		const [card, profiles] = await Promise.all([
			loadCardFromContrail(did, rkey, db),
			loadProfilesFromContrail(handle, db)
		]);

		if (!card) throw error(404, 'Card not found');
		cardValue = card;

		if (profiles) {
			const hasBskyProfile = profiles.some(
				(p) => p.did === did && p.collection === 'app.bsky.actor.profile'
			);
			if (hasBskyProfile) {
				const extracted = extractProfileData(did, profiles);
				profile = extracted.profile;
				publication = extracted.publication;
				pronounsRecord = extracted.pronounsRecord;
			} else {
				// Contrail didn't return bsky profile — fetch from PDS
				const [prof, mainPub, pronouns] = await Promise.all([
					getDetailedProfile({ did }),
					getSelfPublicationFromPDS(did),
					getPronounsFromPDS(did)
				]);
				profile = prof;
				publication = mainPub?.value as WebsiteData['publication'] | undefined;
				pronounsRecord = pronouns;

				const extracted = extractProfileData(did, profiles);
				if (!publication) publication = extracted.publication;
				if (!pronounsRecord) pronounsRecord = extracted.pronounsRecord;
			}
		}
	}

	if (!cardValue) {
		// Fallback: no D1 (e.g. vite dev) — fetch from PDS
		const [cardRecord, prof, pronouns] = await Promise.all([
			getRecord({ did, collection: 'app.blento.card', rkey }).catch(() => undefined),
			getDetailedProfile({ did }),
			getPronounsFromPDS(did)
		]);

		if (!cardRecord?.value) throw error(404, 'Card not found');
		cardValue = cardRecord.value as Item;
		profile = prof;
		pronounsRecord = pronouns;
	}

	if (!profile) throw error(404);

	const card = migrateCard(structuredClone(cardValue));
	const page = card.page ?? 'blento.self';

	// For non-self pages, publication comes from app.blento.page (not in contrail profiles).
	if (!publication || page !== 'blento.self') {
		const pubRecord = await getRecord({
			did,
			collection: page === 'blento.self' ? 'site.standard.publication' : 'app.blento.page',
			rkey: page
		}).catch(() => undefined);
		if (pubRecord?.value) publication = pubRecord.value as WebsiteData['publication'];
	}

	const cards = [card];
	const resolvedHandle = profile?.handle || (isHandle(handle) ? handle : did);

	const additionalData = await loadAdditionalData(
		cards,
		{ did, handle: resolvedHandle, cache, platform },
		env
	);

	return {
		page,
		handle: resolvedHandle,
		did,
		cards,
		sections: [],
		publication: publication ?? defaultPublication(profile),
		additionalData,
		profile,
		pronouns: formatPronouns(pronounsRecord, profile),
		pronounsRecord,
		updatedAt: Date.now(),
		version: 1
	};
}

export async function loadCardTypeData(
	handle: ActorIdentifier,
	type: string,
	cardData: Record<string, unknown>,
	cache: CacheService | undefined,
	env?: Record<string, string | undefined>,
	platform?: App.Platform
): Promise<WebsiteData> {
	if (!handle) throw error(404);
	if (handle === 'favicon.ico') throw error(404);

	const cardDef = CardDefinitionsByType[type];
	if (!cardDef) {
		throw error(404, 'Card type not found');
	}

	const did = await resolveDid(handle);
	if (!did) throw error(404);

	const db = platform?.env?.DB;

	let profile: WebsiteData['profile'] | undefined;
	let publication: WebsiteData['publication'] | undefined;
	let pronounsRecord: PronounsRecord | undefined;

	if (db) {
		const profiles = await loadProfilesFromContrail(handle, db);
		if (profiles) {
			const hasBskyProfile = profiles.some(
				(p) => p.did === did && p.collection === 'app.bsky.actor.profile'
			);
			if (hasBskyProfile) {
				const extracted = extractProfileData(did, profiles);
				profile = extracted.profile;
				publication = extracted.publication;
				pronounsRecord = extracted.pronounsRecord;
			} else {
				const extracted = extractProfileData(did, profiles);
				publication = extracted.publication;
				pronounsRecord = extracted.pronounsRecord;
			}
		}
	}

	if (!profile) {
		const [pubRecord, prof, pronouns] = await Promise.all([
			getSelfPublicationFromPDS(did),
			getDetailedProfile({ did }),
			getPronounsFromPDS(did)
		]);
		profile = prof;
		if (!publication) publication = pubRecord?.value as WebsiteData['publication'] | undefined;
		if (!pronounsRecord) pronounsRecord = pronouns;
	}

	if (!profile) throw error(404);

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
		{ did, handle: resolvedHandle, cache, platform },
		env
	);

	return checkData({
		page: 'blento.self',
		handle: resolvedHandle,
		did,
		cards,
		sections: [],
		publication: publication ?? defaultPublication(profile),
		additionalData,
		profile,
		pronouns: formatPronouns(pronounsRecord, profile),
		pronounsRecord,
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

function hashCardData(items: Item[]): string {
	const str = JSON.stringify(items.map((i) => i.cardData ?? null));
	let hash = 0x811c9dc5;
	for (let i = 0; i < str.length; i++) {
		hash ^= str.charCodeAt(i);
		hash = Math.imul(hash, 0x01000193);
	}
	return (hash >>> 0).toString(36);
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
				const loader = () => cardDef.loadData!(items, { did, handle, cache });
				if (cache && cardDef.cacheLoadData) {
					const opts = typeof cardDef.cacheLoadData === 'object' ? cardDef.cacheLoadData : {};
					const key = `${cardType}:${did}:${hashCardData(items)}`;
					additionDataPromises[cardType] = cache.swr('card-data', key, loader, {
						ttl: opts.ttl,
						staleWindow: opts.staleWindow,
						waitUntil: platform?.context?.waitUntil?.bind(platform.context)
					});
				} else {
					additionDataPromises[cardType] = loader();
				}
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
		const bySection = new Map<string | undefined, Item[]>();
		for (const card of cards) {
			const key = card.sectionId;
			const bucket = bySection.get(key);
			if (bucket) bucket.push(card);
			else bySection.set(key, [card]);
		}

		let hasLayoutIssue = false;
		for (const sectionCards of bySection.values()) {
			hasLayoutIssue ||= hasOverlaps(sectionCards, false) || hasOverlaps(sectionCards, true);
			fixAllCollisions(sectionCards, false);
			fixAllCollisions(sectionCards, true);
			compactItems(sectionCards, false);
			compactItems(sectionCards, true);
		}
		data.hasLayoutIssue = hasLayoutIssue;
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
