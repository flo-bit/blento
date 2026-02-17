import { getRecord } from '$lib/atproto';
import type { CardDefinition } from '../../types';
import { platformsData } from '../BigSocialCard';
import GermDMCard from './GermDMCard.svelte';

const germ = platformsData.germ;

export const GermDMCardDefinition = {
	type: 'germDM',
	contentComponent: GermDMCard,
	createNew: (card) => {
		card.w = 2;
		card.h = 2;
		card.mobileW = 4;
		card.mobileH = 4;
		card.cardData.label = 'Message me';
	},
	loadData: async (_items, { did }) => {
		try {
			const record = await getRecord({
				did,
				collection: 'com.germnetwork.declaration',
				rkey: 'self'
			});
			const value = record?.value;
			if (!value?.messageMe) return null;
			return {
				messageMeUrl: value.messageMe.messageMeUrl,
				showButtonTo: value.messageMe.showButtonTo
			};
		} catch {
			return null;
		}
	},
	canAdd: ({ collections }) => collections.includes('com.germnetwork.declaration'),
	defaultColor: 'transparent',
	allowSetColor: false,
	canHaveLabel: true,
	name: 'DM on Germ',
	keywords: ['germ', 'dm', 'message', 'chat', 'encrypted'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
  <path stroke-linecap="round" stroke-linejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.605L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 0-8.862 12.872M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177-.529A2.25 2.25 0 0 0 17.128 15H16.5l-.324-.324a1.453 1.453 0 0 0-2.328.377l-.036.073a1.586 1.586 0 0 1-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m5.276-3.67a9.012 9.012 0 0 1-5.276 3.67m0 0a9 9 0 0 1-10.275-4.835M15.75 9c0 .896-.393 1.7-1.016 2.25" />
</svg>`
} as CardDefinition & { type: 'germDM' };
