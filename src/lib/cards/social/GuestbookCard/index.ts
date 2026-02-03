import { getPostThread } from '$lib/atproto/methods';
import type { CardDefinition } from '../../types';
import GuestbookCard from './GuestbookCard.svelte';
import CreateGuestbookCardModal from './CreateGuestbookCardModal.svelte';

export const GuestbookCardDefinition = {
	type: 'guestbook',
	contentComponent: GuestbookCard,
	creationModalComponent: CreateGuestbookCardModal,
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
	name: 'Guestbook',
	keywords: ['comments', 'visitors', 'message', 'sign'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" /></svg>`
} as CardDefinition & { type: 'guestbook' };
