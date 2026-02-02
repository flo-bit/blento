import type { CardDefinition } from '../types';
import CreateKickstarterCardModal from './CreateKickstarterCardModal.svelte';
import KickstarterCard from './KickstarterCard.svelte';

const cardType = 'kickstarter';

export const KickstarterCardDefinition = {
	type: cardType,
	contentComponent: KickstarterCard,
	creationModalComponent: CreateKickstarterCardModal,
	createNew: (item) => {
		item.cardType = cardType;
		item.cardData = { widgetType: 'card' };
		item.w = 4;
		item.h = 4;
		item.mobileW = 8;
		item.mobileH = 8;
	},

	onUrlHandler: (url, item) => {
		const match = url.match(/kickstarter\.com\/projects\/([^/]+\/[^/?#]+)/i);
		if (!match) return null;

		item.cardData.src = `https://www.kickstarter.com/projects/${match[1]}/widget/card.html?v=2`;
		item.cardData.widgetType = 'card';
		item.w = 4;
		item.h = 4;
		item.mobileW = 8;
		item.mobileH = 8;

		return item;
	},

	defaultColor: 'transparent',
	allowSetColor: false,

	urlHandlerPriority: 10,

	name: 'Kickstarter',
	keywords: ['kickstarter', 'crowdfunding', 'campaign', 'funding'],
	groups: ['Social'],
	icon: `<svg class="size-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M20.9257 17.2442C20.9257 16.3321 20.6731 15.4527 20.1362 14.6709L18.1153 11.7719L20.1362 8.87291C20.6731 8.12373 20.9257 7.21169 20.9257 6.29964C20.9257 3.88924 18.9994 2.03257 16.7258 2.03257C15.3996 2.03257 14.0733 2.71661 13.2523 3.88924L12.2418 5.32245C11.8629 3.40064 10.2524 2 8.19984 2C5.83151 2 4 3.95438 4 6.36479V17.2768C4 19.6872 5.86309 21.6416 8.19984 21.6416C10.2208 21.6416 11.7997 20.3386 12.2102 18.4494L13.0944 19.7523C13.9154 20.9901 15.2733 21.6416 16.5995 21.6416C18.9994 21.6741 20.9257 19.6546 20.9257 17.2442Z" stroke="currentColor" stroke-width="2"/>
</svg>
`
} as CardDefinition & { type: typeof cardType };
