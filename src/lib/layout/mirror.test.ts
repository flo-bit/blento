import { describe, it, expect, vi } from 'vitest';
import type { Item } from '$lib/types';

// Mock CardDefinitionsByType — tests don't need real card definitions
vi.mock('$lib/cards', () => ({
	CardDefinitionsByType: {}
}));

import { mirrorItemSize, mirrorLayout, shouldMirror } from './mirror';

function makeItem(overrides: Partial<Item> & { id: string }): Item {
	return {
		w: 2,
		h: 2,
		x: 0,
		y: 0,
		mobileW: 4,
		mobileH: 4,
		mobileX: 0,
		mobileY: 0,
		cardType: 'text',
		cardData: {},
		...overrides
	};
}

describe('shouldMirror', () => {
	it('mirrors when editedOn is 0 (never edited) and no layoutMode', () => {
		expect(shouldMirror(0, undefined, false)).toBe(true);
		expect(shouldMirror(0, undefined, true)).toBe(true);
	});

	it('mirrors when only one layout edited and no layoutMode', () => {
		expect(shouldMirror(1, undefined, false)).toBe(true);
		expect(shouldMirror(2, undefined, true)).toBe(true);
	});

	it('does not mirror when both layouts edited and no layoutMode', () => {
		expect(shouldMirror(3, undefined, false)).toBe(false);
		expect(shouldMirror(3, undefined, true)).toBe(false);
	});

	it('desktop-leads: mirrors only when editing desktop', () => {
		expect(shouldMirror(3, 'desktop-leads', false)).toBe(true);
		expect(shouldMirror(3, 'desktop-leads', true)).toBe(false);
	});

	it('mobile-leads: mirrors only when editing mobile', () => {
		expect(shouldMirror(3, 'mobile-leads', true)).toBe(true);
		expect(shouldMirror(3, 'mobile-leads', false)).toBe(false);
	});

	it('independent: never mirrors', () => {
		expect(shouldMirror(0, 'independent', false)).toBe(false);
		expect(shouldMirror(0, 'independent', true)).toBe(false);
	});
});

describe('mirrorItemSize', () => {
	it('desktop → mobile: doubles dimensions', () => {
		const item = makeItem({ id: 'a', w: 3, h: 2 });
		mirrorItemSize(item, false);
		expect(item.mobileW).toBe(6);
		expect(item.mobileH).toBe(4);
	});

	it('desktop → mobile: caps width at COLUMNS (8)', () => {
		const item = makeItem({ id: 'a', w: 6, h: 2 });
		mirrorItemSize(item, false);
		expect(item.mobileW).toBe(8);
		expect(item.mobileH).toBe(4);
	});

	it('mobile → desktop: halves dimensions with snap-even', () => {
		const item = makeItem({ id: 'a', mobileW: 6, mobileH: 4 });
		mirrorItemSize(item, true);
		// snapEven(6/2) = snapEven(3) = max(2, round(1.5)*2) = max(2, 4) = 4
		expect(item.w).toBe(4);
		expect(item.h).toBe(2);
	});

	it('mobile → desktop: exact halves', () => {
		const item = makeItem({ id: 'a', mobileW: 4, mobileH: 4 });
		mirrorItemSize(item, true);
		// snapEven(4/2) = snapEven(2) = max(2, round(1)*2) = 2
		expect(item.w).toBe(2);
		expect(item.h).toBe(2);
	});

	it('mobile → desktop: minimum width is 2', () => {
		const item = makeItem({ id: 'a', mobileW: 2, mobileH: 2 });
		mirrorItemSize(item, true);
		expect(item.w).toBe(2); // snapEven(1) = max(2, round(0.5)*2) = max(2, 1*2) = 2
		expect(item.h).toBe(1); // round(2/2) = 1
	});
});

describe('mirrorLayout desktop → mobile', () => {
	it('two items that fit side-by-side on mobile stay side-by-side', () => {
		// Two 2-wide items next to each other on desktop → 4-wide on mobile, should fit in 8 cols
		const a = makeItem({ id: 'a', x: 0, y: 0, w: 2, h: 2 });
		const b = makeItem({ id: 'b', x: 2, y: 0, w: 2, h: 2 });
		const items = [a, b];

		mirrorLayout(items, false);

		// Both should be on the same row
		expect(a.mobileY).toBe(b.mobileY);
		// They should not overlap
		expect(a.mobileX + a.mobileW).toBeLessThanOrEqual(b.mobileX);
	});

	it('preserves reading order', () => {
		const a = makeItem({ id: 'a', x: 0, y: 0, w: 4, h: 2 });
		const b = makeItem({ id: 'b', x: 4, y: 0, w: 4, h: 2 });
		const c = makeItem({ id: 'c', x: 0, y: 2, w: 4, h: 2 });
		const items = [a, b, c];

		mirrorLayout(items, false);

		// a and b are on the same desktop row but become full-width on mobile (8 cols each)
		// So they must stack. a should come before b, and b before c.
		expect(a.mobileY).toBeLessThan(b.mobileY);
		expect(b.mobileY).toBeLessThan(c.mobileY);
	});

	it('does not leave gaps when items fit next to each other', () => {
		// Three 2-wide items on one desktop row → 4-wide on mobile, two fit per row
		const a = makeItem({ id: 'a', x: 0, y: 0, w: 2, h: 2 });
		const b = makeItem({ id: 'b', x: 2, y: 0, w: 2, h: 2 });
		const c = makeItem({ id: 'c', x: 4, y: 0, w: 2, h: 2 });
		const items = [a, b, c];

		mirrorLayout(items, false);

		// a and b should be on the same row
		expect(a.mobileY).toBe(b.mobileY);
		// c should be on the next row (only 4 cols left isn't enough... wait, 8 - 4 - 4 = 0)
		// Actually a(4) + b(4) = 8, c must go to next row
		expect(c.mobileY).toBe(a.mobileY + a.mobileH);
		// c should start at x=0
		expect(c.mobileX).toBe(0);
	});

	it('full-width items stack vertically', () => {
		const a = makeItem({ id: 'a', x: 0, y: 0, w: 8, h: 2 });
		const b = makeItem({ id: 'b', x: 0, y: 2, w: 8, h: 2 });
		const items = [a, b];

		mirrorLayout(items, false);

		expect(a.mobileW).toBe(8);
		expect(b.mobileW).toBe(8);
		expect(a.mobileY).toBe(0);
		expect(b.mobileY).toBe(a.mobileH);
	});
});

describe('mirrorLayout mobile → desktop', () => {
	it('two mobile items that fit side-by-side on desktop stay side-by-side', () => {
		const a = makeItem({ id: 'a', mobileX: 0, mobileY: 0, mobileW: 4, mobileH: 4 });
		const b = makeItem({ id: 'b', mobileX: 4, mobileY: 0, mobileW: 4, mobileH: 4 });
		const items = [a, b];

		mirrorLayout(items, true);

		// Both should be on the same desktop row
		expect(a.y).toBe(b.y);
		expect(a.x + a.w).toBeLessThanOrEqual(b.x);
	});

	it('preserves reading order from mobile layout', () => {
		const a = makeItem({ id: 'a', mobileX: 0, mobileY: 0, mobileW: 8, mobileH: 4 });
		const b = makeItem({ id: 'b', mobileX: 0, mobileY: 4, mobileW: 8, mobileH: 4 });
		const c = makeItem({ id: 'c', mobileX: 0, mobileY: 8, mobileW: 8, mobileH: 4 });
		const items = [a, b, c];

		mirrorLayout(items, true);

		// a before b before c in desktop Y
		expect(a.y).toBeLessThanOrEqual(b.y);
		expect(b.y).toBeLessThanOrEqual(c.y);
	});
});
