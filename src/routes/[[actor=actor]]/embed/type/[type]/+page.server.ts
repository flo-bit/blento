import { createCache } from '$lib/cache';
import { getActor } from '$lib/actor';
import { loadCardTypeData } from '$lib/website/load';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

function parseQueryParamValue(value: string): unknown {
	const trimmed = value.trim();

	if (trimmed === 'true') return true;
	if (trimmed === 'false') return false;
	if (trimmed === 'null') return null;

	if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(trimmed)) {
		return Number(trimmed);
	}

	if (
		(trimmed.startsWith('{') && trimmed.endsWith('}')) ||
		(trimmed.startsWith('[') && trimmed.endsWith(']'))
	) {
		try {
			return JSON.parse(trimmed);
		} catch {
			return value;
		}
	}

	return value;
}

function getCardDataFromSearchParams(searchParams: URLSearchParams) {
	const cardData: Record<string, unknown> = {};
	const keys = new Set(searchParams.keys());

	for (const key of keys) {
		const values = searchParams.getAll(key).map(parseQueryParamValue);
		cardData[key] = values.length === 1 ? values[0] : values;
	}

	return cardData;
}

export async function load({ params, platform, request, url }) {
	const cache = createCache(platform);
	const actor = await getActor({ request, paramActor: params.actor, platform });

	if (!actor) {
		throw error(404, 'Page not found');
	}

	return await loadCardTypeData(
		actor,
		params.type,
		getCardDataFromSearchParams(url.searchParams),
		cache,
		env
	);
}
