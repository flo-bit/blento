import { getPostThread } from '$lib/atproto/methods';
import type { CardDefinition } from '../types';
import GuestbookCard from './GuestbookCard.svelte';
import CreateGuestbookCardModal from './CreateGuestbookCardModal.svelte';

export const GuestbookCardDefinition = {
	type: 'guestbook',
	contentComponent: GuestbookCard,
	creationModalComponent: CreateGuestbookCardModal,
	sidebarButtonText: 'Guestbook',
	createNew: (card) => {
		card.w = 4;
		card.h = 6;
		card.mobileW = 8;
		card.mobileH = 12;
		card.cardData.label = 'Guestbook';
	},
	minW: 4,
	minH: 4,
	defaultColor: 'base',
	canHaveLabel: true,
	loadData: async (items) => {
		const uris = items
			.filter((item) => item.cardData?.uri)
			.map((item) => item.cardData.uri as string);

		if (uris.length === 0) return {};

		const results: Record<string, unknown[]> = {};

		await Promise.all(
			uris.map(async (uri) => {
				try {
					const thread = await getPostThread({ uri, depth: 1 });
					if (thread && '$type' in thread && thread.$type === 'app.bsky.feed.defs#threadViewPost') {
						const typedThread = thread as { replies?: unknown[] };
						results[uri] = (typedThread.replies ?? [])
							.filter(
								(r: unknown) =>
									r != null &&
									typeof r === 'object' &&
									'$type' in r &&
									(r as { $type: string }).$type === 'app.bsky.feed.defs#threadViewPost'
							)
							.sort((a: unknown, b: unknown) => {
								const timeA = new Date(
									((a as any).post?.record?.createdAt as string) ?? 0
								).getTime();
								const timeB = new Date(
									((b as any).post?.record?.createdAt as string) ?? 0
								).getTime();
								return timeB - timeA;
							});
					}
				} catch (e) {
					console.error('Failed to load guestbook thread for', uri, e);
				}
			})
		);

		return results;
	},
	name: 'Guestbook'
} as CardDefinition & { type: 'guestbook' };
