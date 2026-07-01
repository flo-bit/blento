import { describe, it, expect } from 'vitest';
import { migrateV1, migratePage, type V1Card, type V1Section } from './migrate.js';

function card(p: Partial<V1Card>): V1Card {
	return {
		id: 'c1',
		cardType: 'link',
		x: 0,
		y: 0,
		w: 2,
		h: 2,
		mobileX: 0,
		mobileY: 0,
		mobileW: 4,
		mobileH: 4,
		cardData: {},
		version: 2,
		...p
	};
}

const section = (p: Partial<V1Section>): V1Section => ({
	id: 's1',
	sectionType: 'grid',
	page: 'blento.self',
	index: 0,
	sectionData: {},
	...p
});

const stableIds = () => {
	let n = 0;
	return () => `gen${n++}`;
};

describe('migrateV1', () => {
	it('maps a section to a container and cards to leaves with layout + style', () => {
		const nodes = migrateV1(
			[section({ id: 's1' })],
			[
				card({ id: 'a', sectionId: 's1', x: 0, y: 2, color: 'red' }),
				card({ id: 'b', sectionId: 's1', x: 0, y: 0 })
			],
			'blento.self'
		);

		expect(nodes.find((n) => n.id === 's1')).toMatchObject({
			kind: 'container',
			content: { $type: 'app.blento.defs#container', containerType: 'grid' },
			parent: null,
			page: 'blento.self'
		});

		const a = nodes.find((n) => n.id === 'a')!;
		expect(a).toMatchObject({
			kind: 'leaf',
			content: { $type: 'app.blento.defs#card', cardType: 'link' },
			parent: 's1'
		});
		expect(a.layout).toMatchObject({ x: 0, y: 2, w: 2, h: 2, mobileW: 4 });
		expect(a.style).toEqual({ tokens: { color: 'red' } });

		// document order: b (y=0) ranks before a (y=2)
		const b = nodes.find((n) => n.id === 'b')!;
		expect(b.rank < a.rank).toBe(true);
		expect(b.style).toBeUndefined();
	});

	it('synthesizes a default grid container when there are no sections', () => {
		const nodes = migrateV1([], [card({ id: 'x' })], 'blento.self', { genId: stableIds() });
		const container = nodes.find((n) => n.kind === 'container')!;
		expect(container.content.containerType).toBe('grid');
		expect(container.id).toBe('gen0');
		expect(nodes.find((n) => n.id === 'x')!.parent).toBe('gen0');
	});

	it('reparents orphan cards (dangling sectionId) to the default grid container', () => {
		const nodes = migrateV1(
			[section({ id: 's1' })],
			[card({ id: 'o', sectionId: 'does-not-exist' })],
			'p'
		);
		expect(nodes.find((n) => n.id === 'o')!.parent).toBe('s1');
	});

	it('subsumes v1 coord-doubling for unversioned cards', () => {
		const nodes = migrateV1(
			[section({ id: 's1' })],
			[card({ id: 'c', sectionId: 's1', x: 1, y: 1, w: 1, h: 1, version: undefined })],
			'p'
		);
		expect(nodes.find((n) => n.id === 'c')!.layout).toMatchObject({ x: 2, y: 2, w: 2, h: 2 });
	});

	it('produces unique, ordered ranks within a parent', () => {
		const cards = Array.from({ length: 5 }, (_, i) =>
			card({ id: `c${i}`, sectionId: 's1', x: i, y: 0 })
		);
		const nodes = migrateV1([section({ id: 's1' })], cards, 'p');
		const ranks = nodes.filter((n) => n.kind === 'leaf').map((n) => n.rank);
		expect(new Set(ranks).size).toBe(5);
		expect([...ranks].sort()).toEqual(ranks); // already in ascending rank order (x ascending)
	});
});

describe('migratePage', () => {
	it('maps accent/base colors to semantic token roles + carries name/description', () => {
		const page = migratePage({
			name: 'My Site',
			description: 'hi',
			preferences: { accentColor: 'pink', baseColor: 'stone' }
		});
		expect(page.style?.colors).toEqual({ accent: 'pink', base: 'stone' });
		expect(page.name).toBe('My Site');
		expect(page.description).toBe('hi');
		expect(page.version).toBe(1);
	});

	it('omits style when no theme prefs are set', () => {
		expect(migratePage({ name: 'x' }).style).toBeUndefined();
		expect(migratePage(undefined)).toMatchObject({ $type: 'app.blento.page', version: 1 });
	});
});
