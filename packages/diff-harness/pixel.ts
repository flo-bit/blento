/**
 * Pixel diff between two screenshots → a diff image + mismatch ratio. The visual fidelity gate
 * (complement to the content diff). Crops both to common dimensions since v1/v2 page heights differ.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

function cropData(src: PNG, w: number, h: number): Buffer {
	if (src.width === w && src.height === h) return src.data;
	const out = Buffer.alloc(w * h * 4);
	for (let y = 0; y < h; y++) {
		src.data.copy(out, y * w * 4, y * src.width * 4, y * src.width * 4 + w * 4);
	}
	return out;
}

export interface PixelResult {
	ratio: number;
	diffPixels: number;
	width: number;
	height: number;
}

export function pixelDiff(aPath: string, bPath: string, diffOut: string): PixelResult {
	const a = PNG.sync.read(readFileSync(aPath));
	const b = PNG.sync.read(readFileSync(bPath));
	const width = Math.min(a.width, b.width);
	const height = Math.min(a.height, b.height);
	const diff = new PNG({ width, height });
	const diffPixels = pixelmatch(
		cropData(a, width, height),
		cropData(b, width, height),
		diff.data,
		width,
		height,
		{ threshold: 0.15 }
	);
	writeFileSync(diffOut, PNG.sync.write(diff));
	return { ratio: diffPixels / (width * height), diffPixels, width, height };
}

// CLI: `pixel <a.png> <b.png> <diff.png>`
if (import.meta.url === `file://${process.argv[1]}`) {
	const base = process.env.INIT_CWD ?? process.cwd();
	const [a, b, out] = process.argv.slice(2);
	if (!a || !b || !out) {
		console.error('usage: pixel <a.png> <b.png> <diff.png>');
		process.exit(2);
	}
	const r = pixelDiff(resolve(base, a), resolve(base, b), resolve(base, out));
	console.log(`mismatch: ${(r.ratio * 100).toFixed(1)}% (${r.diffPixels}px of ${r.width}×${r.height})`);
}
