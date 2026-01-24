import type { CardDefinition } from '../types';
import { listRecords } from '$lib/atproto';
import PopfeedReviewsCard from './PopfeedReviewsCard.svelte';

export const PopfeedReviewsCardDefinition = {
	type: 'recentPopfeedReviews',
	contentComponent: PopfeedReviewsCard,
	createNew: (card) => {
		card.w = 8;
		card.mobileW = 8;
		card.h = 3;
		card.mobileH = 6;
	},
	loadData: async (items, { did }) => {
		const data = await listRecords({ did, collection: 'social.popfeed.feed.review' });

		return data;
	},
	minH: 3,
	sidebarButtonText: 'Popfeed Reviews',
	canHaveLabel: true
} as CardDefinition & { type: 'recentPopfeedReviews' };
