import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { error } from '@sveltejs/kit';
import { getActor } from '$lib/actor';
import { createCache } from '$lib/cache';

export async function GET({ params, platform, request }) {
	const actor = await getActor({
		request,
		paramActor: params.actor,
		platform,
		blockBoth: false
	});

	if (!actor) {
		throw error(404, 'Page not found');
	}

	const cache = createCache(platform);
	const cacheKey = actor;

	// Check KV cache first
	const cached = await cache?.getArrayBuffer('og', cacheKey);
	if (cached) {
		return new Response(cached, {
			headers: {
				'Content-Type': 'image/png',
				'Cache-Control': 'public, max-age=86400'
			}
		});
	}

	const handle = params.actor ?? publicEnv.PUBLIC_HANDLE;
	const siteUrl = `${publicEnv.PUBLIC_DOMAIN}/${handle}`;

	const accountId = env.CLOUDFLARE_ACCOUNT_ID;
	const apiToken = env.CLOUDFLARE_API_TOKEN;

	if (!accountId || !apiToken) {
		throw error(500, 'Missing Cloudflare credentials');
	}

	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${accountId}/browser-rendering/screenshot`,
		{
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiToken}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				url: siteUrl,
				screenshotOptions: {
					type: 'png',
					clip: {
						x: 0,
						y: 0,
						width: 1200,
						height: 630
					}
				},
				viewport: {
					width: 1200,
					height: 630,
					deviceScaleFactor: 2
				},
				waitForTimeout: 3000
			})
		}
	);

	if (!response.ok) {
		console.error('Cloudflare screenshot API error:', response.status, await response.text());
		throw error(502, 'Failed to generate OG image');
	}

	const imageBuffer = await response.arrayBuffer();

	// Cache in KV (don't await — fire and forget)
	cache?.putArrayBuffer('og', cacheKey, imageBuffer).catch(() => {});

	return new Response(imageBuffer, {
		headers: {
			'Content-Type': 'image/png',
			'Cache-Control': 'public, max-age=86400'
		}
	});
}
