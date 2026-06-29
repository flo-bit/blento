/**
 * Structural diff — compares two normalized trees by position and reports divergences with a path.
 * Position-aligned (not LCS): good enough to flag "the structure/content changed" for the rewrite
 * gate. A future improvement is LCS alignment to reduce cascade noise after an insert/delete.
 */
import type { StructNode } from './normalize.ts';

export type DivergenceKind = 'tag' | 'text' | 'attr' | 'missing' | 'extra' | 'kind';

export interface Divergence {
	path: string;
	kind: DivergenceKind;
	detail: string;
}

export function diffStruct(a: StructNode[], b: StructNode[], path = ''): Divergence[] {
	const out: Divergence[] = [];
	const max = Math.max(a.length, b.length);
	for (let i = 0; i < max; i++) {
		const left = a[i];
		const right = b[i];
		const here = `${path}/${i}`;

		if (left && !right) {
			out.push({ path: here, kind: 'missing', detail: describe(left) + ' present in live, absent in new' });
			continue;
		}
		if (!left && right) {
			out.push({ path: here, kind: 'extra', detail: describe(right) + ' present in new, absent in live' });
			continue;
		}
		if (!left || !right) continue;

		if (left.kind !== right.kind) {
			out.push({ path: here, kind: 'kind', detail: `${left.kind} vs ${right.kind}` });
			continue;
		}

		if (left.kind === 'text' && right.kind === 'text') {
			if (left.text !== right.text) {
				out.push({ path: here, kind: 'text', detail: `"${left.text}" vs "${right.text}"` });
			}
			continue;
		}

		if (left.kind === 'el' && right.kind === 'el') {
			const p = `${here}/${left.tag}`;
			if (left.tag !== right.tag) {
				out.push({ path: p, kind: 'tag', detail: `<${left.tag}> vs <${right.tag}>` });
				continue; // different element — don't recurse into mismatched subtrees
			}
			for (const k of new Set([...Object.keys(left.attrs), ...Object.keys(right.attrs)])) {
				if (left.attrs[k] !== right.attrs[k]) {
					out.push({
						path: p,
						kind: 'attr',
						detail: `${k}: ${JSON.stringify(left.attrs[k])} vs ${JSON.stringify(right.attrs[k])}`
					});
				}
			}
			out.push(...diffStruct(left.children, right.children, p));
		}
	}
	return out;
}

function describe(n: StructNode): string {
	return n.kind === 'text' ? `text "${n.text.slice(0, 40)}"` : `<${n.tag}>`;
}
