/**
 * Structural normalization — the core of the structural-faithful diff (plan §9).
 *
 * Reduces an HTML document to a canonical tree of meaning: tag names, a small set of semantic
 * attributes (href/src/alt/role/aria/…), and normalized text. It deliberately DROPS classes,
 * inline styles, ids, whitespace, comments, and presentational noise — so the diff is robust to
 * the styling change (we drop Tailwind) and flags only changes that alter content or structure.
 */
import { parse, type HTMLElement, type Node as PNode } from 'node-html-parser';

export interface StructEl {
	kind: 'el';
	tag: string;
	attrs: Record<string, string>;
	children: StructNode[];
}
export interface StructText {
	kind: 'text';
	text: string;
}
export type StructNode = StructEl | StructText;

/** Tags whose presence and contents are irrelevant to rendered structure. */
const DROP_TAGS = new Set(['script', 'style', 'noscript', 'template', 'link', 'meta', 'head']);

/** The only attributes that carry structural/content meaning. Everything else is dropped. */
const KEEP_ATTRS = new Set([
	'href',
	'src',
	'srcset',
	'alt',
	'role',
	'type',
	'name',
	'value',
	'for',
	'rel',
	'target',
	'controls',
	'poster',
	'loading',
	'title',
	'lang',
	'aria-label',
	'aria-hidden',
	'aria-current',
	'aria-expanded'
]);

/** Tags kept as opaque leaves — their internal geometry is presentation noise (icon path data). */
const OPAQUE_TAGS = new Set(['svg']);

export interface NormalizeOptions {
	keepAttrs?: Set<string>;
	dropTags?: Set<string>;
	opaqueTags?: Set<string>;
}

const ws = (s: string) => s.replace(/\s+/g, ' ').trim();

export function normalizeHtml(html: string, opts: NormalizeOptions = {}): StructNode[] {
	const keep = opts.keepAttrs ?? KEEP_ATTRS;
	const drop = opts.dropTags ?? DROP_TAGS;
	const opaque = opts.opaqueTags ?? OPAQUE_TAGS;
	const root = parse(html, { comment: false, blockTextElements: { script: false, style: false } });
	return normChildren(root.childNodes, keep, drop, opaque);
}

function normChildren(
	nodes: PNode[],
	keep: Set<string>,
	drop: Set<string>,
	opaque: Set<string>
): StructNode[] {
	const out: StructNode[] = [];
	for (const node of nodes) {
		// nodeType: 1 = element, 3 = text (per node-html-parser)
		if (node.nodeType === 3) {
			const text = ws(node.text ?? '');
			if (text) out.push({ kind: 'text', text });
			continue;
		}
		if (node.nodeType !== 1) continue;
		const el = node as HTMLElement;
		const tag = (el.rawTagName ?? '').toLowerCase();
		if (!tag || drop.has(tag)) continue;

		const attrs: Record<string, string> = {};
		for (const [k, v] of Object.entries(el.attributes ?? {})) {
			const key = k.toLowerCase();
			if (keep.has(key)) attrs[key] = ws(String(v));
		}

		out.push({
			kind: 'el',
			tag,
			attrs,
			children: opaque.has(tag) ? [] : normChildren(el.childNodes, keep, drop, opaque)
		});
	}
	return out;
}
