import type { Item, WebsiteData, SectionRecord } from '../types';
import { CardDefinitionsByType } from '../cards';
import { deleteRecord, putRecord } from '$lib/atproto';
import { getName, getDescription, getHideProfileSection } from './website';
import { planPageWrite, type V1Card, type V1Section } from '@blento/schema';
import { env } from '$env/dynamic/public';

/**
 * Node migration (app.blento.node storage) is OFF by default. The prod read path (contrail) still
 * serves card/section, so writing nodes + deleting card/section would blank a page there. Enable it
 * per-deploy (dev / self-host) only once the read path resolves app.blento.node everywhere — set
 * PUBLIC_ENABLE_NODE_MIGRATION=true. The read side is already dual-format, so flipping this is safe
 * wherever node reads work, and a half-migrated repo still renders (migrate-on-read covers the rest).
 */
function nodeMigrationEnabled(): boolean {
	return env.PUBLIC_ENABLE_NODE_MIGRATION === 'true';
}

export async function savePage(
	data: WebsiteData,
	currentItems: Item[],
	originalCards: Item[],
	originalPublication: string,
	originalSections?: SectionRecord[]
) {
	const promises = [];
	const useNodes = nodeMigrationEnabled();

	// Run each card type's upload side effect (e.g. image blobs) before snapshotting content.
	const uploadedItems: Item[] = [];
	for (let item of currentItems) {
		item.updatedAt = new Date().toISOString();
		const cardDef = CardDefinitionsByType[item.cardType];
		if (cardDef?.upload) item = await cardDef.upload(item);
		uploadedItems.push(item);
	}

	if (useNodes) {
		// Migrate-on-save: persist the page as app.blento.node records, retiring the legacy card/section
		// records the first time the page is migrated. Geometry -> layout, color -> style, content -> data.
		const plan = planPageWrite({
			sections: data.sections as unknown as V1Section[],
			cards: uploadedItems as unknown as V1Card[],
			page: data.page,
			updatedAt: new Date().toISOString(),
			storedNodeIds: data.migratedStorage ? (data.nodes ?? []).map((n) => n.id) : [],
			legacyCardIds: data.migratedStorage ? [] : originalCards.map((c) => c.id),
			legacySectionIds: data.migratedStorage ? [] : (originalSections ?? []).map((s) => s.id)
		});

		for (const { rkey, record } of plan.nodePuts) {
			promises.push(
				putRecord({
					collection: 'app.blento.node',
					rkey,
					record: record as unknown as Record<string, unknown>
				})
			);
		}
		// Deletes are tolerant: a not-yet-existing legacy/removed record is a no-op, not an error.
		for (const rkey of plan.nodeDeletes) {
			promises.push(deleteRecord({ collection: 'app.blento.node', rkey }).catch(() => {}));
		}
		for (const rkey of plan.cardDeletes) {
			promises.push(deleteRecord({ collection: 'app.blento.card', rkey }).catch(() => {}));
		}
		for (const rkey of plan.sectionDeletes) {
			promises.push(deleteRecord({ collection: 'app.blento.section', rkey }).catch(() => {}));
		}
	} else {
		// Legacy path (v1 behavior): write card + section records.
		for (const section of data.sections) {
			section.updatedAt = new Date().toISOString();
			section.version = 1;
			const record = JSON.parse(JSON.stringify(section));
			const rkey = record.id;
			delete record.id;
			promises.push(putRecord({ collection: 'app.blento.section', rkey, record }));
		}
		if (originalSections) {
			for (const original of originalSections) {
				if (!data.sections.find((s) => s.id === original.id)) {
					promises.push(deleteRecord({ collection: 'app.blento.section', rkey: original.id }));
				}
			}
		}
		for (const item of uploadedItems) {
			const parsedItem = JSON.parse(JSON.stringify(item));
			parsedItem.page = data.page;
			parsedItem.version = 2;
			promises.push(
				putRecord({ collection: 'app.blento.card', rkey: parsedItem.id, record: parsedItem })
			);
		}
		for (const originalItem of originalCards) {
			if (!currentItems.find((i) => i.id === originalItem.id)) {
				promises.push(deleteRecord({ collection: 'app.blento.card', rkey: originalItem.id }));
			}
		}
	}

	if (
		data.publication?.preferences?.hideProfile !== undefined &&
		data.publication?.preferences?.hideProfileSection === undefined
	) {
		data.publication.preferences.hideProfileSection = data.publication?.preferences?.hideProfile;
	}

	// With nodes on, the root record moves to app.blento.page for all pages and the legacy
	// site.standard.publication store is retired on first migration. Legacy path keeps v1's split
	// (app.blento.page for sub-pages, site.standard.publication for the main page).
	const needsRootMigration = useNodes && data.page === 'blento.self' && !data.migratedStorage;
	if (
		!originalPublication ||
		originalPublication !== JSON.stringify(data.publication) ||
		needsRootMigration
	) {
		data.publication ??= {
			name: getName(data),
			description: getDescription(data),
			preferences: {
				hideProfileSection: getHideProfileSection(data)
			}
		};

		if (!data.publication.url) {
			data.publication.url = 'https://blento.app/' + data.handle;

			if (data.page !== 'blento.self') {
				data.publication.url += '/' + data.page.replace('blento.', '');
			}
		}

		if (useNodes || data.page !== 'blento.self') {
			promises.push(
				putRecord({ collection: 'app.blento.page', rkey: data.page, record: data.publication })
			);
		} else {
			promises.push(
				putRecord({
					collection: 'site.standard.publication',
					rkey: data.page,
					record: data.publication
				})
			);
		}
		if (needsRootMigration) {
			promises.push(
				deleteRecord({ collection: 'site.standard.publication', rkey: data.page }).catch(() => {})
			);
		}

		console.log('updating or adding publication', data.publication);
	}

	// check if pronouns edited and save
	if (data.pronounsRecord?.value?.sets?.length) {
		const existing = data.pronounsRecord.value;
		const now = new Date().toISOString();
		const record: Record<string, unknown> = {
			$type: 'app.nearhorizon.actor.pronouns',
			sets: existing.sets,
			displayMode: existing.displayMode ?? 'all',
			createdAt: existing.createdAt ?? now
		};
		if (existing.createdAt) {
			record.updatedAt = now;
		}
		promises.push(
			putRecord({
				collection: 'app.nearhorizon.actor.pronouns',
				rkey: 'self',
				record
			})
		);
	}

	await Promise.all(promises);

	// Invalidate cached OG image so the next scrape regenerates it.
	// Fire-and-forget; server checks auth against the signed-cookie session.
	fetch(`/${data.did}/og-new.png`, { method: 'DELETE' }).catch(() => {});
}
