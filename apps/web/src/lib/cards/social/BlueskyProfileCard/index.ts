import type { CardDefinition } from '../../types';
import BlueskyProfileCard from './BlueskyProfileCard.svelte';

export const BlueskyProfileCardDefinition = {
	type: 'blueskyProfile',
	contentComponent: BlueskyProfileCard,
	keywords: ['bsky', 'atproto', 'account', 'user'],
	createNew: () => {}
} as CardDefinition & { type: 'blueskyProfile' };
