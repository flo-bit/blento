/**
 * Simulate what checkData() does to a user's layout on load.
 * Uses react-grid-layout directly to avoid Svelte import chain.
 *
 * Usage: npx tsx scripts/atproto.ts listRecords <handle> app.blento.card 2>/dev/null | npx tsx scripts/simulate-load.ts
 */
import {
	correctBounds,
	verticalCompactor,
	type LayoutItem
} from 'react-grid-layout/core';
import * as fs from 'fs';

const COLUMNS = 8;

type Item = {
	id: string;
	x: number; y: number; w: number; h: number;
	mobileX: number; mobileY: number; mobileW: number; mobileH: number;
	cardType: string;
};

function toLayout(items: Item[], mobile: boolean): LayoutItem[] {
	return items.map((item) =>
		mobile
			? { x: item.mobileX, y: item.mobileY, w: item.mobileW, h: item.mobileH, i: item.id }
			: { x: item.x, y: item.y, w: item.w, h: item.h, i: item.id }
	);
}

function applyLayout(items: Item[], layout: LayoutItem[], mobile: boolean) {
	const map = new Map(items.map((i) => [i.id, i]));
	for (const l of layout) {
		const item = map.get(l.i);
		if (!item) continue;
		if (mobile) { item.mobileX = l.x; item.mobileY = l.y; }
		else { item.x = l.x; item.y = l.y; }
	}
}

function fixAllCollisions(items: Item[], mobile: boolean) {
	let layout = toLayout(items, mobile);
	correctBounds(layout as any, { cols: COLUMNS });
	layout = verticalCompactor.compact(layout, COLUMNS) as LayoutItem[];
	applyLayout(items, layout, mobile);
}

function compactItems(items: Item[], mobile: boolean) {
	const layout = toLayout(items, mobile);
	const compacted = verticalCompactor.compact(layout, COLUMNS) as LayoutItem[];
	applyLayout(items, compacted, mobile);
}

// ---

const input = fs.readFileSync('/dev/stdin', 'utf8');
const records = JSON.parse(input);

const cards: Item[] = records
	.filter((r: any) => r.value.cardType && (!r.value.page || r.value.page === 'blento.self'))
	.map((r: any) => ({
		id: r.value.id,
		x: r.value.x, y: r.value.y, w: r.value.w, h: r.value.h,
		mobileX: r.value.mobileX, mobileY: r.value.mobileY,
		mobileW: r.value.mobileW, mobileH: r.value.mobileH,
		cardType: r.value.cardType
	}));

// Save original positions
const originals = cards.map((c) => ({ ...c }));

// Simulate checkData — fixAllCollisions only (no separate compactItems)
fixAllCollisions(cards, false);
fixAllCollisions(cards, true);

// Compare
let desktopChanges = 0;
let mobileChanges = 0;

for (const card of cards) {
	const orig = originals.find((o) => o.id === card.id)!;
	const dChanged = card.x !== orig.x || card.y !== orig.y;
	const mChanged = card.mobileX !== orig.mobileX || card.mobileY !== orig.mobileY;

	if (dChanged || mChanged) {
		console.log(
			`${orig.cardType.padEnd(20)} id=${orig.id}` +
				(dChanged ? `  DESKTOP: (${orig.x},${orig.y}) → (${card.x},${card.y})` : '') +
				(mChanged ? `  MOBILE: (${orig.mobileX},${orig.mobileY}) → (${card.mobileX},${card.mobileY})` : '')
		);
		if (dChanged) desktopChanges++;
		if (mChanged) mobileChanges++;
	}
}

if (desktopChanges === 0 && mobileChanges === 0) {
	console.log('No layout changes on load — checkData is not the culprit.');
} else {
	console.log(`\n${desktopChanges} desktop changes, ${mobileChanges} mobile changes on load.`);
}

// Check for ORDER changes in mobile layout
console.log('\n=== Mobile reading order (y, then x) ===');
const sortByMobile = (items: { id: string; mobileX: number; mobileY: number; cardType: string }[]) =>
	[...items].sort((a, b) => a.mobileY - b.mobileY || a.mobileX - b.mobileX);

const origOrder = sortByMobile(originals);
const newOrder = sortByMobile(cards);

let orderChanges = 0;
for (let i = 0; i < origOrder.length; i++) {
	const same = origOrder[i].id === newOrder[i].id;
	if (!same) orderChanges++;
	const orig = originals.find(o => o.id === newOrder[i].id)!;
	const card = cards.find(c => c.id === newOrder[i].id)!;
	console.log(
		`${i.toString().padStart(2)}: ${same ? '  ' : '!!'} ` +
		`${card.cardType.padEnd(20)} ` +
		`was (${orig.mobileX},${orig.mobileY}) → now (${card.mobileX},${card.mobileY})` +
		(!same ? `  [was #${origOrder.findIndex(o => o.id === newOrder[i].id)}]` : '')
	);
}
console.log(`\n${orderChanges} order changes in mobile layout.`);
