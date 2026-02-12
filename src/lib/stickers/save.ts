import { deleteRecord, putRecord } from '$lib/atproto';
import { checkAndUploadImage } from '$lib/helper';
import type { Sticker } from './types';

export function stickersEqual(a: Sticker, b: Sticker): boolean {
	return (
		a.id === b.id &&
		a.type === b.type &&
		a.x === b.x &&
		a.y === b.y &&
		a.rotation === b.rotation &&
		a.scale === b.scale &&
		a.emoji === b.emoji &&
		a.page === b.page &&
		JSON.stringify(a.image) === JSON.stringify(b.image)
	);
}

export async function saveStickers(
	originalStickers: Sticker[],
	currentStickers: Sticker[],
	page: string
) {
	const promises: Promise<unknown>[] = [];

	const originalById = new Map<string, Sticker>();
	for (const s of originalStickers) {
		originalById.set(s.id, s);
	}

	for (const sticker of currentStickers) {
		const orig = originalById.get(sticker.id);
		const unchanged = orig && stickersEqual(orig, sticker);

		if (!unchanged) {
			sticker.updatedAt = new Date().toISOString();

			if (sticker.type === 'image') {
				await checkAndUploadImage(sticker, 'image');
			}

			const record = JSON.parse(JSON.stringify(sticker));
			record.page = page;

			promises.push(
				putRecord({
					collection: 'app.blento.sticker',
					rkey: sticker.id,
					record
				})
			);
		}
	}

	const currentIds = new Set(currentStickers.map((s) => s.id));
	for (const orig of originalStickers) {
		if (!currentIds.has(orig.id)) {
			promises.push(deleteRecord({ collection: 'app.blento.sticker', rkey: orig.id }));
		}
	}

	await Promise.all(promises);
}
