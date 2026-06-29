import { describe, it, expect } from 'vitest';
import { buildGraph, nodesToItems, type V1Card, type V1Section } from './migrate.js';

const grid: V1Section = { id: 's', sectionType: 'grid', page: 'p', index: 0, sectionData: {} };

describe('buildGraph + nodesToItems (read path)', () => {
	it('buildGraph passes coords through verbatim (no ladder), even for version-less cards', () => {
		const cards: V1Card[] = [
			{
				id: 'c',
				cardType: 'text',
				sectionId: 's',
				x: 3,
				y: 5,
				w: 2,
				h: 2,
				mobileX: 0,
				mobileY: 0,
				mobileW: 4,
				mobileH: 2,
				cardData: {}
			} // no version — migrateV1 would double these; buildGraph must not
		];
		const leaf = buildGraph([grid], cards, 'p').find((n) => n.kind === 'leaf')!;
		expect((leaf.layout as Record<string, number>).x).toBe(3);
		expect((leaf.layout as Record<string, number>).y).toBe(5);
	});

	it('nodesToItems inverts buildGraph into render-equivalent sections/cards', () => {
		const cards: V1Card[] = [
			{
				id: 'c1',
				cardType: 'link',
				sectionId: 's',
				x: 0,
				y: 0,
				w: 2,
				h: 2,
				mobileX: 0,
				mobileY: 0,
				mobileW: 4,
				mobileH: 2,
				color: 'rose',
				cardData: { url: 'https://example.com' },
				version: 2
			},
			{
				id: 'c2',
				cardType: 'text',
				sectionId: 's',
				x: 2,
				y: 0,
				w: 2,
				h: 2,
				mobileX: 0,
				mobileY: 2,
				mobileW: 4,
				mobileH: 2,
				cardData: {},
				version: 2
			}
		];
		const view = nodesToItems(buildGraph([grid], cards, 'p', { order: 'input' }));
		expect(view.sections).toHaveLength(1);
		expect(view.sections[0]).toMatchObject({ id: 's', sectionType: 'grid', page: 'p', index: 0 });
		expect(view.cards).toHaveLength(2);
		const c1 = view.cards.find((c) => c.id === 'c1')!;
		expect(c1).toMatchObject({
			cardType: 'link',
			x: 0,
			y: 0,
			w: 2,
			h: 2,
			sectionId: 's',
			color: 'rose'
		});
		expect(c1.cardData).toEqual({ url: 'https://example.com' });
	});

	it('synthesizes a grid section when none exist and assigns orphan cards to it', () => {
		const cards: V1Card[] = [
			{
				id: 'c',
				cardType: 'image',
				x: 0,
				y: 0,
				w: 4,
				h: 4,
				mobileX: 0,
				mobileY: 0,
				mobileW: 4,
				mobileH: 4,
				cardData: {},
				version: 2
			}
		];
		const view = nodesToItems(buildGraph([], cards, 'p', { order: 'input' }));
		expect(view.sections).toHaveLength(1);
		expect(view.sections[0].sectionType).toBe('grid');
		expect(view.cards[0].sectionId).toBe(view.sections[0].id);
	});
});
