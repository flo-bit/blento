/**
 * Migrate-on-save planning. Given the editor's current sections/cards plus what was loaded, compute
 * the exact record mutations: write the node graph, and retire the legacy card/section records the
 * first time a page is migrated. Pure + deterministic so it can be unit-tested without a PDS; the
 * caller (save.ts) executes the plan with the owner's OAuth session.
 */
import { buildGraph, type V1Card, type V1Section } from './migrate.js';
import { nodeToRecord, type NodeRecord } from './serialize.js';

export interface PageWritePlan {
	/** app.blento.node records to put (rkey = node id). */
	nodePuts: { rkey: string; record: NodeRecord }[];
	/** app.blento.node rkeys to delete (nodes removed since load). */
	nodeDeletes: string[];
	/** app.blento.card rkeys to retire (legacy cleanup; empty once the page is on nodes). */
	cardDeletes: string[];
	/** app.blento.section rkeys to retire (legacy cleanup; empty once the page is on nodes). */
	sectionDeletes: string[];
}

export interface PlanPageWriteInput {
	sections: V1Section[];
	/** Current cards (post-upload), each carrying its rkey as `id`. */
	cards: V1Card[];
	page: string;
	updatedAt: string;
	/** ids of the app.blento.node records currently stored (empty if the page is still legacy). */
	storedNodeIds: string[];
	/** ids of the legacy card/section records to retire (empty once the page is already on nodes). */
	legacyCardIds: string[];
	legacySectionIds: string[];
}

export function planPageWrite(input: PlanPageWriteInput): PageWritePlan {
	const nodes = buildGraph(input.sections, input.cards, input.page, { order: 'input' });
	const newIds = new Set(nodes.map((n) => n.id));
	return {
		nodePuts: nodes.map((n) => ({ rkey: n.id, record: nodeToRecord(n, input.updatedAt) })),
		nodeDeletes: input.storedNodeIds.filter((id) => !newIds.has(id)),
		cardDeletes: input.legacyCardIds,
		sectionDeletes: input.legacySectionIds
	};
}
