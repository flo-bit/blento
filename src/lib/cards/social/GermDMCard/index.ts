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
	defaultColor: 'transparent',
	allowSetColor: false,
	canHaveLabel: true,
	name: 'DM on Germ',
	keywords: ['germ', 'dm', 'message', 'chat', 'encrypted'],
	groups: ['Social'],
	icon: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="size-4">${germ.svg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}</svg>`
} as CardDefinition & { type: 'germDM' };
