import * as TID from '@atcute/tid';
import type { Item, SectionRecord } from '$lib/types';

export function ensureSections(
	storedSections: SectionRecord[],
	cards: Item[],
	page: string
): { sections: SectionRecord[]; cards: Item[] } {
	if (storedSections.length > 0) {
		const firstGridId =
			storedSections.find((s) => s.sectionType === 'grid')?.id ?? storedSections[0].id;
		const fixedCards = cards.map((c) => (c.sectionId ? c : { ...c, sectionId: firstGridId }));
		return { sections: storedSections, cards: fixedCards };
	}

	const newId = TID.now();
	const synthesized: SectionRecord = {
		id: newId,
		sectionType: 'grid',
		page,
		index: 0,
		sectionData: {},
		version: 1
	};
	const fixedCards = cards.map((c) => ({ ...c, sectionId: c.sectionId ?? newId }));
	return { sections: [synthesized], cards: fixedCards };
}
