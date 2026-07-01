/**
 * Content-anchor diff — a structure-INDEPENDENT fidelity check.
 *
 * The position-aligned structural diff (diff.ts) under-reports when the two DOMs are shaped
 * differently: it stops descending at a tag mismatch, so a different page shell (v2's `<main>` vs
 * v1's wrapper `<div>`) masks everything inside. This instead compares the *set of semantic
 * anchors* — links (hrefs), images (srcs), and text runs — answering the real rewrite question:
 * "what content did the new render drop or add?" regardless of markup. Use this as the primary
 * fidelity gate while v2's structure differs from v1; use diff.ts once structures converge.
 */
import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { normalizeHtml, type StructNode } from './normalize.ts';

export interface ContentAnchors {
	links: string[];
	images: string[];
	text: string[];
}

export function contentAnchors(html: string): ContentAnchors {
	const links = new Set<string>();
	const images = new Set<string>();
	const text: string[] = [];
	const walk = (nodes: StructNode[]) => {
		for (const n of nodes) {
			if (n.kind === 'text') {
				if (n.text.length > 1) text.push(n.text.toLowerCase());
				continue;
			}
			if (n.tag === 'a' && n.attrs.href) links.add(n.attrs.href);
			if (n.tag === 'img' && n.attrs.src) images.add(n.attrs.src);
			walk(n.children);
		}
	};
	walk(normalizeHtml(html));
	return { links: [...links], images: [...images], text };
}

const missing = (a: string[], b: string[]) => {
	const s = new Set(b);
	return a.filter((x) => !s.has(x));
};

export interface ContentDiff {
	missingLinks: string[];
	extraLinks: string[];
	missingImages: string[];
	extraImages: string[];
	missingTextCount: number;
	extraTextCount: number;
}

export function contentDiff(liveHtml: string, newHtml: string): ContentDiff {
	const a = contentAnchors(liveHtml);
	const b = contentAnchors(newHtml);
	return {
		missingLinks: missing(a.links, b.links),
		extraLinks: missing(b.links, a.links),
		missingImages: missing(a.images, b.images),
		extraImages: missing(b.images, a.images),
		missingTextCount: missing(a.text, b.text).length,
		extraTextCount: missing(b.text, a.text).length
	};
}

// CLI: `content <liveDir> <newDir>` → per-site + total missing/extra links & images.
if (import.meta.url === `file://${process.argv[1]}`) {
	const base = process.env.INIT_CWD ?? process.cwd();
	const [liveArg, newArg] = process.argv.slice(2);
	if (!liveArg || !newArg) {
		console.error('usage: content <liveDir> <newDir>');
		process.exit(2);
	}
	const liveDir = resolve(base, liveArg);
	const newDir = resolve(base, newArg);
	const files = (await readdir(liveDir)).filter((f) => f.endsWith('.html'));
	let totLink = 0;
	let totImg = 0;
	for (const file of files) {
		let newHtml: string;
		try {
			newHtml = await readFile(`${newDir}/${file}`, 'utf8');
		} catch {
			continue;
		}
		const d = contentDiff(await readFile(`${liveDir}/${file}`, 'utf8'), newHtml);
		totLink += d.missingLinks.length;
		totImg += d.missingImages.length;
		console.log(
			`  ${file.replace(/\.html$/, '')}: missing ${d.missingLinks.length} links, ${d.missingImages.length} images (text runs −${d.missingTextCount})`
		);
		for (const l of d.missingLinks.slice(0, 6)) console.log(`      − ${l}`);
	}
	console.log(`\ntotal missing across sites: ${totLink} links, ${totImg} images`);
}
