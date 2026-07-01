import type { CardDefinition } from '../../types';
import BaserowFormCard from './BaserowFormCard.svelte';
import CreateBaserowFormCardModal from './CreateBaserowFormCardModal.svelte';
import SourceSettings from '../../_settings/SourceSettings.svelte';
import { parseBaserowFormUrl } from './baserow';

const cardType = 'baserow-form';

export const BaserowFormCardDefinition = {
	type: cardType,
	contentComponent: BaserowFormCard,
	creationModalComponent: CreateBaserowFormCardModal,
	settingsComponent: SourceSettings,
	source: {
		label: 'Baserow form URL',
		placeholder: 'https://baserow.io/form/…',
		errorMessage: "That doesn't look like a Baserow form link",
		apply: (url, item) => {
			const parsed = parseBaserowFormUrl(url);
			if (!parsed) return false;
			item.cardData.href = parsed;
			return true;
		}
	},

	createNew: (item) => {
		item.cardType = cardType;
		item.cardData = {};
		item.w = 4;
		item.h = 5;
		item.mobileW = 8;
		item.mobileH = 10;
	},

	onUrlHandler: (url, item) => {
		const parsed = parseBaserowFormUrl(url);
		if (!parsed) return null;
		item.cardData.href = parsed;
		item.w = 4;
		item.h = 5;
		item.mobileW = 8;
		item.mobileH = 10;
		return item;
	},

	defaultColor: 'transparent',
	allowSetColor: false,

	urlHandlerPriority: 5,

	name: 'Baserow Form',
	keywords: ['baserow', 'form', 'survey', 'signup', 'email', 'questionnaire', 'embed'],
	groups: ['Social'],
	icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" /></svg>`
} as CardDefinition & { type: typeof cardType };
