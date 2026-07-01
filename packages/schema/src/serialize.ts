/**
 * Node <-> `app.blento.node` record serialization.
 *
 * The in-memory Node carries `id` (= the record's rkey) and a non-null `parent` sentinel; the stored
 * record omits both the rkey (it's the key) and `parent` when at the document root. Undefined blobs
 * are dropped so records stay minimal.
 */
import type { Content, Layout, Node, NodeKind, Source, Style } from './node.js';

export interface NodeRecord {
	$type: 'app.blento.node';
	kind: NodeKind;
	parent?: string;
	rank: string;
	page: string;
	content: Content;
	layout?: Layout;
	style?: Style;
	source?: Source;
	updatedAt?: string;
	version: number;
}

export function nodeToRecord(node: Node, updatedAt?: string): NodeRecord {
	const rec: NodeRecord = {
		$type: 'app.blento.node',
		kind: node.kind,
		rank: node.rank,
		page: node.page,
		content: node.content,
		version: node.version
	};
	if (node.parent != null) rec.parent = node.parent;
	if (node.source !== undefined) rec.source = node.source;
	if (node.layout !== undefined) rec.layout = node.layout;
	if (node.style !== undefined) rec.style = node.style;
	if (updatedAt) rec.updatedAt = updatedAt;
	return rec;
}

export function recordToNode(rkey: string, rec: NodeRecord): Node {
	const node: Node = {
		id: rkey,
		kind: rec.kind,
		parent: rec.parent ?? null,
		rank: rec.rank,
		page: rec.page,
		content: rec.content ?? { $type: 'app.blento.defs#card' },
		version: rec.version ?? 1
	};
	if (rec.source !== undefined) node.source = rec.source;
	if (rec.layout !== undefined) node.layout = rec.layout;
	if (rec.style !== undefined) node.style = rec.style;
	return node;
}
