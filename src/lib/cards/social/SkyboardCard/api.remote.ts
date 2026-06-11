import { query, getRequestEvent } from '$app/server';
import { createCache } from '$lib/helpers/cache';
import type { SkyboardBoardData } from './types';

const APPVIEW_URL = 'https://appview.skyboard.dev';

/**
 * Fetch a readonly, fully-materialized skyboard board from the appview.
 * The appview applies LWW op resolution and task ordering, so we only render.
 */
export const fetchSkyboardBoard = query(
	'unchecked',
	async ({ did, rkey }: { did: string; rkey: string }): Promise<SkyboardBoardData | undefined> => {
		const { platform } = getRequestEvent();
		const cache = createCache(platform);

		const cacheKey = `${did}/${rkey}`;
		const cached = await cache?.getJSON<SkyboardBoardData>('skyboard', cacheKey);
		if (cached) return cached;

		const response = await fetch(
			`${APPVIEW_URL}/board/${encodeURIComponent(did)}/${encodeURIComponent(rkey)}`
		);
		if (!response.ok) return undefined;

		const data = await response.json();
		if (!data?.board) return undefined;

		// Trim to what the card renders before caching.
		const trimmed: SkyboardBoardData = {
			board: {
				uri: data.board.uri,
				did: data.board.did,
				rkey: data.board.rkey,
				name: data.board.name,
				description: data.board.description ?? null,
				columns: data.board.columns ?? [],
				labels: data.board.labels ?? [],
				open: Boolean(data.board.open),
				createdAt: data.board.createdAt
			},
			tasks: (data.tasks ?? []).map((t: SkyboardBoardData['tasks'][number]) => ({
				uri: t.uri,
				did: t.did,
				rkey: t.rkey,
				effectiveTitle: t.effectiveTitle,
				effectiveDescription: t.effectiveDescription,
				effectiveColumnId: t.effectiveColumnId,
				effectiveParentTaskUri: t.effectiveParentTaskUri,
				effectivePosition: t.effectivePosition,
				effectiveLabelIds: t.effectiveLabelIds ?? [],
				createdAt: t.createdAt
			}))
		};

		await cache?.putJSON('skyboard', cacheKey, trimmed);
		return trimmed;
	}
);
