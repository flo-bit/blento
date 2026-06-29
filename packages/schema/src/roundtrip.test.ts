import { describe, it, expect } from 'vitest';
import {
	buildGraph,
	nodesToItems,
	nodeToRecord,
	recordToNode,
	type V1Card,
	type V1Section
} from './index.js';

const grid: V1Section = { id: 's', sectionType: 'grid', page: 'p', index: 0, sectionData: {} };
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
		rotation: 3,
		cardData: { url: 'https://example.com' },
		version: 2
	},
	{
		id: 'c2',
		cardType: 'image',
		sectionId: 's',
		x: 2,
		y: 0,
		w: 2,
		h: 2,
		mobileX: 0,
		mobileY: 2,
		mobileW: 4,
		mobileH: 2,
		cardData: { cid: 'abc' },
		version: 2
	}
];

describe('full storage round-trip (write → records → read)', () => {
	it('cards/sections → nodes → records → nodes → cards/sections is render-lossless', () => {
		const nodes = buildGraph([grid], cards, 'p', { order: 'input' });
		const direct = nodesToItems(nodes);
		// simulate persistence: each node -> app.blento.node record -> node (the write/read boundary)
		const reread = nodes.map((n) => recordToNode(n.id, nodeToRecord(n)));
		expect(nodesToItems(reread)).toEqual(direct);
	});
});
