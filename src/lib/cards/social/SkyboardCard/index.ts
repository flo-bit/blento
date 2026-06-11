import type { CardDefinition } from '../../types';
import CreateSkyboardCardModal from './CreateSkyboardCardModal.svelte';
import SkyboardCard from './SkyboardCard.svelte';
import SourceSettings from '../../_settings/SourceSettings.svelte';
import { fetchSkyboardBoard } from './api.remote';
import type { SkyboardBoardData, SkyboardLoadedData } from './types';

export type { SkyboardLoadedData };

async function loadBoards(items: { cardData: Record<string, unknown> }[]) {
	const boards: Record<string, SkyboardBoardData> = {};
	for (const item of items) {
		const did = item.cardData.did as string | undefined;
		const rkey = item.cardData.rkey as string | undefined;
		if (!did || !rkey) continue;
		try {
			const data = await fetchSkyboardBoard({ did, rkey });
			if (data) boards[`${did}/${rkey}`] = data;
		} catch (error) {
			console.error('Failed to fetch skyboard board:', error);
		}
	}
	return boards;
}

export const SkyboardCardDefinition = {
	type: 'skyboard',
	contentComponent: SkyboardCard,
	creationModalComponent: CreateSkyboardCardModal,
	settingsComponent: SourceSettings,
	source: {
		label: 'Board URL',
		placeholder: 'skyboard.dev/board/did:plc:.../rkey',
		errorMessage: "That doesn't look like a Skyboard board link"
	},

	// loadDataServer takes precedence on SSR; fetchSkyboardBoard does its own KV
	// caching (`skyboard` namespace), so cacheLoadData/SWR isn't needed here.
	loadData: loadBoards,
	loadDataServer: loadBoards,

	createNew: (card) => {
		card.cardData = {};
		card.w = 6;
		card.h = 4;
		card.mobileW = 8;
		card.mobileH = 8;
	},

	onUrlHandler: (url, item) => {
		const parsed = parseSkyboardUrl(url);
		if (!parsed) return null;

		item.cardData.href = url;
		item.cardData.did = parsed.did;
		item.cardData.rkey = parsed.rkey;

		item.w = 6;
		item.h = 4;
		item.mobileW = 8;
		item.mobileH = 8;
		return item;
	},
	urlHandlerPriority: 5,

	canChange: (item) => Boolean(parseSkyboardUrl(item.cardData.href)),
	change: (item) => {
		const parsed = parseSkyboardUrl(item.cardData.href);
		if (parsed) {
			item.cardData.did = parsed.did;
			item.cardData.rkey = parsed.rkey;
		}
		return item;
	},

	minW: 2,
	minH: 2,

	name: 'Skyboard',
	keywords: ['kanban', 'board', 'tasks', 'todo', 'project'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18"/></svg>`
} as CardDefinition & { type: 'skyboard' };

/**
 * Parse a skyboard board reference into { did, rkey }.
 * Accepts:
 *   https://skyboard.dev/board/{did}/{rkey}
 *   at://{did}/dev.skyboard.board/{rkey}
 */
export function parseSkyboardUrl(
	url: string | undefined
): { did: string; rkey: string } | undefined {
	if (!url) return;
	const trimmed = url.trim();

	// at:// URI form
	const atMatch = trimmed.match(/^at:\/\/(did:[^/]+)\/dev\.skyboard\.board\/([^/?#]+)/);
	if (atMatch) {
		return { did: atMatch[1], rkey: atMatch[2] };
	}

	try {
		const parsed = new URL(trimmed);
		if (!/^(www\.)?skyboard\.dev$/.test(parsed.hostname)) return;

		const segments = parsed.pathname.split('/').filter(Boolean);
		// /board/{did}/{rkey}
		if (segments.length === 3 && segments[0] === 'board' && segments[1].startsWith('did:')) {
			return { did: segments[1], rkey: segments[2] };
		}
		return;
	} catch {
		return;
	}
}
