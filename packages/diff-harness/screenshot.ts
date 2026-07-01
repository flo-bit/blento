/**
 * Capture a full-page screenshot of a URL (headless Chromium). Used to make visual fidelity
 * measurable: screenshot v1 (live) and v2 (dev) for the same site, then pixel-diff them.
 */
import { resolve } from 'node:path';
import { chromium } from 'playwright';

export interface ShotOptions {
	width?: number;
	height?: number;
	fullPage?: boolean;
}

export async function capture(url: string, outPath: string, opts: ShotOptions = {}): Promise<void> {
	const browser = await chromium.launch();
	try {
		const page = await browser.newPage({
			viewport: { width: opts.width ?? 1280, height: opts.height ?? 1800 },
			colorScheme: 'dark',
			deviceScaleFactor: 1
		});
		await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
		await page.waitForTimeout(600);
		await page.screenshot({ path: outPath, fullPage: opts.fullPage ?? true });
	} finally {
		await browser.close();
	}
}

// CLI: `screenshot <url> <out.png>`
if (import.meta.url === `file://${process.argv[1]}`) {
	const base = process.env.INIT_CWD ?? process.cwd();
	const [url, out] = process.argv.slice(2);
	if (!url || !out) {
		console.error('usage: screenshot <url> <out.png>');
		process.exit(2);
	}
	await capture(url, resolve(base, out));
	console.error(`saved ${out}`);
}
