/**
 * v1 → v2 migration. Reads v1 records (app.blento.card + app.blento.section + publication) and
 * produces v2 nodes + a page record. See plan §2 (mapping) and §10 (scar tissue to subsume).
 *
 *   section  -> container node   (id preserved; index -> rank)
 *   card     -> leaf node        (sectionId -> parent; coords + rotation -> layout; color -> style)
 *   no sections -> synthesize a default `grid` container (cf. v1 ensureSections)
 *
 * Subsumes v1's own card migration ladder (version<1 doubled coords; version<2 defaulted page).
 */
import * as TID from '@atcute/tid';
import { generateNKeysBetween } from 'fractional-indexing';
import type { Node } from './node.js';
import type { PageRecord, StyleTokens } from './records.js';

export interface V1Card {
	id: string;
	cardType: string;
	sectionId?: string;
	x: number;
	y: number;
	w: number;
	h: number;
	mobileX: number;
	mobileY: number;
	mobileW: number;
	mobileH: number;
	color?: string;
	rotation?: number;
	cardData: unknown;
	page?: string;
	version?: number;
}

export interface V1Section {
	id: string;
	sectionType: string;
	page: string;
	index: number;
	sectionData: Record<string, unknown>;
}

export interface V1Publication {
	url?: string;
	name?: string;
	description?: string;
	preferences?: {
		accentColor?: string;
		baseColor?: string;
		hideProfileSection?: boolean;
		profilePosition?: 'side' | 'top';
		editedOn?: number;
		layoutMode?: string;
	};
}

export interface MigrateOptions {
	/** Id generator for synthesized containers. Defaults to a TID; tests can inject a stable one. */
	genId?: () => string;
}

/** Apply v1's own card migration ladder so we ingest normalized coordinates. */
function normalizeV1Card(input: V1Card): V1Card {
	const c = { ...input };
	if (!c.version) {
		c.x *= 2;
		c.y *= 2;
		c.w *= 2;
		c.h *= 2;
		c.mobileX *= 2;
		c.mobileY *= 2;
		c.mobileW *= 2;
		c.mobileH *= 2;
		c.version = 1;
	}
	if (!c.version || c.version < 2) {
		c.page ??= 'blento.self';
		c.version = 2;
	}
	return c;
}

export function migrateV1(
	sections: V1Section[],
	cards: V1Card[],
	page: string,
	opts: MigrateOptions = {}
): Node[] {
	const genId = opts.genId ?? (() => TID.now());
	const nodes: Node[] = [];

	// 1. Sections -> container nodes, ordered by index. Synthesize a grid container if none exist.
	let sectionList = [...sections].sort((a, b) => a.index - b.index);
	if (sectionList.length === 0) {
		sectionList = [{ id: genId(), sectionType: 'grid', page, index: 0, sectionData: {} }];
	}
	const sectionIds = new Set(sectionList.map((s) => s.id));
	const sectionRanks = generateNKeysBetween(null, null, sectionList.length);
	sectionList.forEach((s, i) => {
		nodes.push({
			id: s.id,
			type: s.sectionType,
			kind: 'container',
			parent: null,
			rank: sectionRanks[i],
			page,
			data: s.sectionData ?? {},
			version: 1
		});
	});

	// Orphan cards (sectionId missing or dangling) go to the first grid container, else the first.
	const defaultContainerId =
		sectionList.find((s) => s.sectionType === 'grid')?.id ?? sectionList[0].id;

	// 2. Cards -> leaf nodes, grouped by parent container.
	const byParent = new Map<string, V1Card[]>();
	for (const raw of cards) {
		const c = normalizeV1Card(raw);
		const parent = c.sectionId && sectionIds.has(c.sectionId) ? c.sectionId : defaultContainerId;
		let group = byParent.get(parent);
		if (!group) {
			group = [];
			byParent.set(parent, group);
		}
		group.push(c);
	}

	for (const [parent, group] of byParent) {
		// Deterministic document order within a grid: by (y, x), then id as a tiebreaker.
		group.sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
		const ranks = generateNKeysBetween(null, null, group.length);
		group.forEach((c, i) => {
			const node: Node = {
				id: c.id,
				type: c.cardType,
				kind: 'leaf',
				parent,
				rank: ranks[i],
				page,
				data: c.cardData ?? {},
				layout: {
					x: c.x,
					y: c.y,
					w: c.w,
					h: c.h,
					mobileX: c.mobileX,
					mobileY: c.mobileY,
					mobileW: c.mobileW,
					mobileH: c.mobileH,
					...(c.rotation ? { rotation: c.rotation } : {})
				},
				version: 1
			};
			if (c.color) node.style = { color: c.color };
			nodes.push(node);
		});
	}

	return nodes;
}

/**
 * Migrate a v1 publication into a v2 page record. Theme colors map to semantic token roles;
 * profile/layout prefs (hideProfileSection, profilePosition, editedOn) are handled when the profile
 * container is built in Phase 5 — preserved on the caller side until then.
 */
export function migratePage(pub: V1Publication | undefined): PageRecord {
	const prefs = pub?.preferences ?? {};
	const colors: Record<string, string> = {};
	if (prefs.accentColor) colors.accent = prefs.accentColor;
	if (prefs.baseColor) colors.base = prefs.baseColor;
	const style: StyleTokens | undefined = Object.keys(colors).length ? { colors } : undefined;

	const record: PageRecord = { $type: 'app.blento.page', version: 1 };
	if (pub?.name) record.name = pub.name;
	if (pub?.description) record.description = pub.description;
	if (style) record.style = style;
	return record;
}
