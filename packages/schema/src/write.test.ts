import { describe, it, expect } from 'vitest';
import { planPageWrite } from './write.js';
import type { V1Card, V1Section } from './migrate.js';

const grid: V1Section = {
	id: 'sec',
	sectionType: 'grid',
	page: 'blento.self',
	index: 0,
	sectionData: {}
};
const card = (id: string, x: number): V1Card => ({
	id,
	cardType: 'link',
	sectionId: 'sec',
	x,
	y: 0,
	w: 2,
	h: 2,
	mobileX: 0,
	mobileY: 0,
	mobileW: 4,
	mobileH: 2,
	cardData: { url: `https://example.com/${id}` },
	version: 2
});

describe('planPageWrite', () => {
	it('first migration (legacy page): writes nodes, retires the legacy card/section records', () => {
		const plan = planPageWrite({
			sections: [grid],
			cards: [card('c1', 0), card('c2', 2)],
			page: 'blento.self',
			updatedAt: '2026-01-01T00:00:00Z',
			storedNodeIds: [], // legacy: no node records yet
			legacyCardIds: ['c1', 'c2'],
			legacySectionIds: ['sec']
		});
		// one container + two leaves
		expect(plan.nodePuts.map((p) => p.rkey).sort()).toEqual(['c1', 'c2', 'sec']);
		expect(plan.nodePuts.every((p) => p.record.$type === 'app.blento.node')).toBe(true);
		// legacy records retired
		expect(plan.cardDeletes.sort()).toEqual(['c1', 'c2']);
		expect(plan.sectionDeletes).toEqual(['sec']);
		expect(plan.nodeDeletes).toEqual([]);
	});

	it('already migrated: no legacy deletes; removed cards delete their node records', () => {
		const plan = planPageWrite({
			sections: [grid],
			cards: [card('c1', 0)], // c2 removed in the editor
			page: 'blento.self',
			updatedAt: '2026-01-01T00:00:00Z',
			storedNodeIds: ['sec', 'c1', 'c2'], // already on nodes
			legacyCardIds: [],
			legacySectionIds: []
		});
		expect(plan.nodePuts.map((p) => p.rkey).sort()).toEqual(['c1', 'sec']);
		expect(plan.nodeDeletes).toEqual(['c2']); // the removed card's node record
		expect(plan.cardDeletes).toEqual([]);
		expect(plan.sectionDeletes).toEqual([]);
	});

	it('node records carry the node envelope (kind, layout, page, updatedAt)', () => {
		const plan = planPageWrite({
			sections: [grid],
			cards: [card('c1', 0)],
			page: 'blento.self',
			updatedAt: '2026-06-29T00:00:00Z',
			storedNodeIds: [],
			legacyCardIds: ['c1'],
			legacySectionIds: ['sec']
		});
		const leaf = plan.nodePuts.find((p) => p.rkey === 'c1')!.record;
		expect(leaf.kind).toBe('leaf');
		expect(leaf.page).toBe('blento.self');
		expect(leaf.updatedAt).toBe('2026-06-29T00:00:00Z');
		expect((leaf.layout as Record<string, number>).x).toBe(0);
		const container = plan.nodePuts.find((p) => p.rkey === 'sec')!.record;
		expect(container.kind).toBe('container');
	});
});
