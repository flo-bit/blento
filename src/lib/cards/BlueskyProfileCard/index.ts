import type { CardDefinition } from '../types';
import BlueskyProfileCard from './BlueskyProfileCard.svelte';

export const BlueskyProfileCardDefinition = {
	type: 'blueskyProfile',
	contentComponent: BlueskyProfileCard,
	createNew: () => {}
} as CardDefinition & { type: 'blueskyProfile' };
