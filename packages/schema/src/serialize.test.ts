import { describe, it, expect } from 'vitest';
import { migrateV1, type V1Card, type V1Section } from './migrate.js';
import { nodeToRecord, recordToNode } from './serialize.js';

const grid: V1Section = {
	id: 'sec1',
	sectionType: 'grid',
	page: 'blento.self',
	index: 0,
	sectionData: {}
};

describe('node <-> record round-trip', () => {
	it('round-trips a migrated graph (record drops id + root parent, restores them)', () => {
		const cards: V1Card[] = [
			{
				id: 'card1',
				cardType: 'link',
				sectionId: 'sec1',
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
			}
		];
		const nodes = migrateV1([grid], cards, 'blento.self');
		for (const node of nodes) {
			expect(recordToNode(node.id, nodeToRecord(node))).toEqual(node);
		}
	});

	it('root container: parent omitted in the record, null on the node', () => {
		const node = migrateV1([grid], [], 'blento.self')[0];
		const rec = nodeToRecord(node);
		expect(rec.parent).toBeUndefined();
		expect(recordToNode(node.id, rec).parent).toBeNull();
	});

	it('layout is integer-only (atproto forbids floats)', () => {
		const cards: V1Card[] = [
			{
				id: 'c',
				cardType: 'text',
				sectionId: 'sec1',
				x: 1,
				y: 2,
				w: 3,
				h: 4,
				mobileX: 0,
				mobileY: 0,
				mobileW: 4,
				mobileH: 4,
				cardData: {},
				version: 2
			}
		];
		const leaf = migrateV1([grid], cards, 'blento.self').find((n) => n.kind === 'leaf')!;
		for (const v of Object.values(leaf.layout as Record<string, unknown>)) {
			if (typeof v === 'number') expect(Number.isInteger(v)).toBe(true);
		}
	});
});
