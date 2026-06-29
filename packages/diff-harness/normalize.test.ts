import { describe, it, expect } from 'vitest';
import { normalizeHtml } from './normalize.ts';
import { diffStruct } from './diff.ts';

describe('structural diff', () => {
	it('ignores class/style/whitespace changes (the de-Tailwind case)', () => {
		const live = `<div class="bg-base-200 p-4"><a href="/x">Hi</a></div>`;
		const next = `<div class="card surface" style="padding:1rem"><a href="/x">  Hi  </a></div>`;
		expect(diffStruct(normalizeHtml(live), normalizeHtml(next))).toEqual([]);
	});

	it('flags a changed href (real content/structure change)', () => {
		const live = `<a href="/x">Hi</a>`;
		const next = `<a href="/y">Hi</a>`;
		const d = diffStruct(normalizeHtml(live), normalizeHtml(next));
		expect(d).toHaveLength(1);
		expect(d[0].kind).toBe('attr');
	});

	it('flags changed text and missing nodes', () => {
		const live = `<ul><li>a</li><li>b</li></ul>`;
		const next = `<ul><li>a</li></ul>`;
		const d = diffStruct(normalizeHtml(live), normalizeHtml(next));
		expect(d.some((x) => x.kind === 'missing')).toBe(true);
	});

	it('treats svg as an opaque leaf (icon internals are noise)', () => {
		const live = `<svg aria-hidden="true"><path d="M0 0"/></svg>`;
		const next = `<svg aria-hidden="true"><path d="M9 9 L1 1"/></svg>`;
		// same svg attrs, different internal path data → children dropped → no divergence
		expect(diffStruct(normalizeHtml(live), normalizeHtml(next))).toEqual([]);
	});
});
