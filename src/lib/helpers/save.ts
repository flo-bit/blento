import type { Item, WebsiteData, SectionRecord } from '../types';
import { CardDefinitionsByType } from '../cards';
import { deleteRecord, getRecord, putRecord } from '$lib/atproto';
import { getName, getDescription, getHideProfileSection } from './website';

export async function savePage(
	data: WebsiteData,
	currentItems: Item[],
	originalCards: Item[],
	originalPublication: string,
	originalSections?: SectionRecord[]
) {
	const promises = [];

	// Save sections
	for (const section of data.sections) {
		section.updatedAt = new Date().toISOString();
		section.version = 1;
		const record = JSON.parse(JSON.stringify(section));
		const rkey = record.id;
		delete record.id;
		promises.push(
			putRecord({
				collection: 'app.blento.section',
				rkey,
				record
			})
		);
	}

	// Delete removed sections
	if (originalSections) {
		for (const original of originalSections) {
			if (!data.sections.find((s) => s.id === original.id)) {
				promises.push(deleteRecord({ collection: 'app.blento.section', rkey: original.id }));
			}
		}
	}

	// Save all current cards. We don't diff against originals because the
	// server-side load can modify cards (e.g. fixing overlaps), so the
	// "original" the client sees is already the post-fix version — there's
	// nothing reliable to diff against.
	for (let item of currentItems) {
		item.updatedAt = new Date().toISOString();
		// run optional upload function for this card type
		const cardDef = CardDefinitionsByType[item.cardType];

		if (cardDef?.upload) {
			item = await cardDef?.upload(item);
		}

		const parsedItem = JSON.parse(JSON.stringify(item));

		parsedItem.page = data.page;
		parsedItem.version = 2;

		promises.push(
			putRecord({
				collection: 'app.blento.card',
				rkey: parsedItem.id,
				record: parsedItem
			})
		);
	}

	// delete items that are in originalItems but not in items
	for (const originalItem of originalCards) {
		const item = currentItems.find((i) => i.id === originalItem.id);
		if (!item) {
			console.log('deleting item', originalItem);
			promises.push(deleteRecord({ collection: 'app.blento.card', rkey: originalItem.id }));
		}
	}

	promises.push(savePublication(data, originalPublication));

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

// Page settings now live in the `app.blento.page` collection. Older sites stored
// the self page in `site.standard.publication` — migrate those by writing the new
// record first and deleting the legacy one only once that write succeeds.
async function savePublication(data: WebsiteData, originalPublication: string) {
	const isSelf = data.page === 'blento.self';

	// Normalize the legacy hideProfile preference into hideProfileSection.
	if (
		data.publication?.preferences?.hideProfile !== undefined &&
		data.publication?.preferences?.hideProfileSection === undefined
	) {
		data.publication.preferences.hideProfileSection = data.publication?.preferences?.hideProfile;
	}

	// Detect a legacy self-page record so we can clean it up after migrating.
	// A read failure just means we skip cleanup this time (retried on next save).
	let legacyExists = false;
	if (isSelf) {
		const legacy = await getRecord({
			collection: 'site.standard.publication',
			rkey: 'blento.self'
		}).catch(() => undefined);
		legacyExists = Boolean(legacy?.value);
	}

	const changed = !originalPublication || originalPublication !== JSON.stringify(data.publication);

	// Nothing changed and nothing to migrate — leave the record untouched.
	if (!changed && !legacyExists) return;

	data.publication ??= {
		name: getName(data),
		description: getDescription(data),
		preferences: {
			hideProfileSection: getHideProfileSection(data)
		}
	};

	if (!data.publication.url) {
		data.publication.url = 'https://blento.app/' + data.handle;
		if (!isSelf) {
			data.publication.url += '/' + data.page.replace('blento.', '');
		}
	}

	// Write the canonical record first; only remove the legacy one if it succeeds.
	await putRecord({
		collection: 'app.blento.page',
		rkey: data.page,
		record: data.publication
	});

	if (isSelf && legacyExists) {
		await deleteRecord({ collection: 'site.standard.publication', rkey: 'blento.self' });
	}
}
