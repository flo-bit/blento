import { describe, it, expect } from 'vitest';
import { contentDiff } from './content.ts';

describe('content-anchor diff (structure-independent)', () => {
	it('ignores wrapper structure when content is the same', () => {
		const live = `<div><main><a href="/x">hi</a><img src="/i.png"></main></div>`;
		const next = `<section><a href="/x">hi</a><img src="/i.png"></section>`;
		const d = contentDiff(live, next);
		expect(d.missingLinks).toEqual([]);
		expect(d.missingImages).toEqual([]);
	});

	it('flags links and images the new render dropped', () => {
		const live = `<a href="/kept">k</a><a href="/dropped">d</a><img src="/i.png">`;
		const next = `<a href="/kept">k</a>`;
		const d = contentDiff(live, next);
		expect(d.missingLinks).toEqual(['/dropped']);
		expect(d.missingImages).toEqual(['/i.png']);
		expect(d.extraLinks).toEqual([]);
	});
});
