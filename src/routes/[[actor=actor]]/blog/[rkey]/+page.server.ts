import { error } from '@sveltejs/kit';
import { getBlentoOrBskyProfile, getRecord, parseUri } from '$lib/atproto/methods.js';
import { createCache, type CachedProfile } from '$lib/cache';
import type { Did } from '@atcute/lexicons';
import { getActor } from '$lib/actor';

export async function load({ params, platform, request }) {
	const { rkey } = params;

	const cache = createCache(platform);

	const did = await getActor({ request, paramActor: params.actor, platform });

	if (!did || !rkey) {
		throw error(404, 'Post not found');
	}

	try {
		const [postRecord, hostProfile] = await Promise.all([
			getRecord({
				did: did as Did,
				collection: 'site.standard.document',
				rkey
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

		if (!postRecord?.value) {
			throw error(404, 'Post not found');
		}

		const post = postRecord.value as Record<string, unknown>;

		// Resolve external URL
		let externalUrl: string | null = null;
		const site = post.site as string | undefined;
		const path = post.path as string | undefined;

		if (site && path && site !== `at://${did}/site.standard.publication/blento.self`) {
			if (site.startsWith('at://')) {
				const siteParts = parseUri(site);
				if (siteParts) {
					try {
						const publicationRecord = await getRecord({
							did: siteParts.repo as Did,
							collection: siteParts.collection!,
							rkey: siteParts.rkey
						});

						if (publicationRecord.value?.url) {
							externalUrl = (publicationRecord.value.url as string) + path;
						}
					} catch {
						// Could not resolve publication URL
					}
				}
			} else {
				externalUrl = site + path;
			}
		}

		return {
			post,
			did,
			rkey,
			hostProfile: hostProfile ?? null,
			externalUrl
		};
	} catch (e) {
		if (e && typeof e === 'object' && 'status' in e) throw e;
		throw error(404, 'Post not found');
	}
}
