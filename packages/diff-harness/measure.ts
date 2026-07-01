/**
 * Measure the live page's actual computed layout — so we match v1's real numbers instead of
 * guessing from screenshots. Dumps rects + font/spacing for the avatar, name, description, and the
 * first grid cards (v1 uses the `.grid-card` class in the read-only view too).
 */
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'https://blento.app/hoopinformatics.bsky.social';
const browser = await chromium.launch();
try {
	const page = await browser.newPage({
		viewport: { width: 1280, height: 1800 },
		colorScheme: 'dark'
	});
	await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
	// Passed as a string so tsx/esbuild doesn't inject helpers (__name) into the browser context.
	const data = await page.evaluate(`(function () {
		function m(el) {
			if (!el) return null;
			var r = el.getBoundingClientRect();
			var s = getComputedStyle(el);
			return {
				rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
				font: s.fontSize + ' / ' + s.lineHeight + ' w' + s.fontWeight,
				padding: s.padding,
				gap: s.gap,
				borderRadius: s.borderRadius
			};
		}
		var name = null, max = 0;
		document.querySelectorAll('h1, div, span, p').forEach(function (el) {
			if (!el.textContent || !el.textContent.trim() || el.children.length > 1) return;
			var size = parseFloat(getComputedStyle(el).fontSize);
			if (size > max) { max = size; name = el; }
		});
		var cards = Array.prototype.slice.call(document.querySelectorAll('.grid-card'), 0, 4).map(m);
		return {
			avatar: m(document.querySelector('img')),
			name: m(name),
			description: m(document.querySelector('[class*="prose"]')),
			cards: cards
		};
	})()`);
	console.log(JSON.stringify(data, null, 2));
} finally {
	await browser.close();
}
