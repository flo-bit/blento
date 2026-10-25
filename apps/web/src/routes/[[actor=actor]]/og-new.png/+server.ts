import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { error, json } from '@sveltejs/kit';
import { getActor } from '$lib/helpers/actor';
import { effectiveDomain } from '$lib/helpers/public-page-cache';
import { MAX_OG_BYTES, ogObjectKey, readOgImage } from '$lib/helpers/og-storage';
import { releaseScreenshot, reserveScreenshot } from '$lib/helpers/screenshot-budget';
import type { RequestHandler } from './$types';

// Public traffic can only retrieve existing bytes. Never call Browser Rendering on a GET miss.
export const GET: RequestHandler = async ({ params, platform, request }) => {
	const actor = await getActor({ request, paramActor: params.actor, platform, blockBoth: false });
	if (!actor) error(404, 'Page not found');
	try {
		const image = await readOgImage(
			platform?.env?.OG_IMAGES,
			platform?.env?.USER_DATA_CACHE,
			actor
		);
		if (image) {
			return new Response(image, {
				headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=60' }
			});
		}
	} catch (err) {
		console.error('OG image read failed', err);
	}
	return new Response(null, {
		status: 302,
		headers: { Location: '/og-default.png', 'Cache-Control': 'public, max-age=60' }
	});
};

// Owner-authorized updates only. SQL quota + lease protect against parallel requests/isolates.
export const POST: RequestHandler = async ({ params, platform, request, locals }) => {
	if (!locals.did) error(401, 'Not authenticated');
	const origin = request.headers.get('origin');
	const domain = effectiveDomain(request);
	if (!origin || !domain) error(403, 'Invalid origin');
	let originUrl: URL;
	try {
		originUrl = new URL(origin);
	} catch {
		error(403, 'Invalid origin');
	}
	if (
		originUrl.origin !== new URL(request.url).origin &&
		originUrl.origin !== `https://${domain}`
	) {
		error(403, 'Invalid origin');
	}
	const actor = await getActor({ request, paramActor: params.actor, platform, blockBoth: false });
	if (!actor) error(404, 'Page not found');
	if (actor !== locals.did) error(403, "Cannot update another user's OG image");
	const db = platform?.env?.DB;
	const bucket = platform?.env?.OG_IMAGES;
	if (!db || !bucket || !env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
		return json({ updated: false, reason: 'unavailable' }, { status: 503 });
	}

	let token: string | undefined;
	try {
		token = await reserveScreenshot(db, actor);
	} catch (err) {
		console.error('Screenshot budget unavailable', err);
		return json({ updated: false, reason: 'unavailable' }, { status: 503 });
	}
	if (!token) {
		return json(
			{ updated: false, reason: 'budget-or-cooldown' },
			{ status: 429, headers: { 'Retry-After': '21600' } }
		);
	}
	const lease = token;
	const generate = async () => {
		try {
			const siteUrl = new URL(`/${encodeURIComponent(actor)}`, publicEnv.PUBLIC_DOMAIN);
			// Bypass rendered HTML caching during owner-triggered generation, without creating cache keys.
			siteUrl.searchParams.set('og-render', lease);
			const response = await fetch(
				`https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/browser-rendering/screenshot`,
				{
					method: 'POST',
					signal: AbortSignal.timeout(20_000),
					headers: {
						Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						url: siteUrl.href,
						screenshotOptions: { type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } },
						viewport: { width: 1200, height: 630, deviceScaleFactor: 1 },
						gotoOptions: { timeout: 15000, waitUntil: 'networkidle2' },
						waitForTimeout: 1000
					})
				}
			);
			if (!response.ok) throw new Error(`Screenshot API returned ${response.status}`);
			const image = await response.arrayBuffer();
			const signature = new Uint8Array(image, 0, Math.min(8, image.byteLength));
			if (image.byteLength > MAX_OG_BYTES || signature.join(',') !== '137,80,78,71,13,10,26,10') {
				throw new Error('Invalid screenshot payload');
			}
			await bucket.put(ogObjectKey(actor), image, { httpMetadata: { contentType: 'image/png' } });
			// Existing image remains available if generation/persistence fails.
			await platform.env.USER_DATA_CACHE.delete(`og:${actor}`);
			return json({ updated: true });
		} catch (err) {
			console.error('Owner screenshot update failed', err);
			return json({ updated: false, reason: 'generation-failed' }, { status: 502 });
		} finally {
			await releaseScreenshot(db, lease).catch((err) =>
				console.error('OG lease release failed', err)
			);
		}
	};
	const work = generate();
	platform.context.waitUntil(work);
	return work;
};

// Compatibility with older editor bundles: refresh, don't delete the last usable preview.
export const DELETE = POST;
