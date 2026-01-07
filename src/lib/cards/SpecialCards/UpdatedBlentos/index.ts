import type { CardDefinition } from '../../types';
import UpdatedBlentosCard from './UpdatedBlentosCard.svelte';

export const UpdatedBlentosCardDefitition = {
	type: 'updatedBlentos',
	contentComponent: UpdatedBlentosCard
} as CardDefinition & { type: 'updatedBlentos' };
