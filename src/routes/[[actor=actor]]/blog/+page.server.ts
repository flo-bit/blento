import { error } from '@sveltejs/kit';
import { getBlentoOrBskyProfile, getRecord, listRecords, parseUri } from '$lib/atproto/methods.js';
import { createCache, type CachedProfile } from '$lib/cache';
import type { Did } from '@atcute/lexicons';
import { getActor } from '$lib/actor.js';

export async function load({ params, platform, request }) {
	const cache = createCache(platform);

	const did = await getActor({ request, paramActor: params.actor, platform });

	if (!did) {
		throw error(404, 'Blog not found');
	}

	try {
		const [records, hostProfile] = await Promise.all([
			listRecords({
				did: did as Did,
				collection: 'site.standard.document',
				limit: 100
			}),
			cache
				? cache.getProfile(did as Did).catch(() => null)
				: getBlentoOrBskyProfile({ did: did as Did })
						.then(
							(p): CachedProfile => ({
								did: p.did as string,
								handle: p.handle as string,
								displayName: p.displayName as string | undefined,
								avatar: p.avatar as string | undefined,
								hasBlento: p.hasBlento,
								url: p.url
							})
						)
						.catch(() => null)
		]);

		// Resolve publication URLs for site fields
		const publications: Record<string, string> = {};

		for (const record of records) {
			const site = record.value.site as string;
			if (!site) continue;

			if (site.startsWith('at://')) {
				if (!publications[site]) {
					const siteParts = parseUri(site);
					if (!siteParts) continue;

					try {
						const publicationRecord = await getRecord({
							did: siteParts.repo as Did,
							collection: siteParts.collection!,
							rkey: siteParts.rkey
						});

						if (publicationRecord.value?.url) {
							publications[site] = publicationRecord.value.url as string;
						}
					} catch {
						continue;
					}
				}

				if (publications[site]) {
					record.value.href = publications[site] + record.value.path;
				}
			} else {
				record.value.href = site + record.value.path;
			}
		}

		const posts = records
			.filter((r) => r.value?.href)
			.map((r) => {
				const value = r.value as Record<string, unknown>;
				return {
					title: value.title as string,
					description: value.description as string | undefined,
					publishedAt: value.publishedAt as string | undefined,
					href: value.href as string,
					coverImage: value.coverImage as { $type: 'blob'; ref: { $link: string } } | undefined,
					rkey: r.uri.split('/').pop() as string
				};
			})
			.sort((a, b) => {
				const dateA = a.publishedAt || '';
				const dateB = b.publishedAt || '';
				return dateB.localeCompare(dateA);
			});

		return {
			posts,
			did,
			hostProfile: hostProfile ?? null
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(404, 'Blog not found');
	}
}
