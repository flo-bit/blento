import type { CardDefinition } from '../../types';
import UpdatedBlentosCard from './UpdatedBlentosCard.svelte';
import { getCDNImageBlobUrl } from '$lib/atproto/methods';
import { getServerClient } from '$lib/contrail';
import type { Did } from '@atcute/lexicons';

type ProfileWithBlentoFlag = {
	did: Did;
	handle: `${string}.${string}`;
	displayName?: string;
	avatar?: string;
	hasBlento: boolean;
	url?: string;
};

function extractProfiles(
	profiles: Array<{
		did: string;
		handle?: string;
		collection?: string;
		rkey?: string;
		record?: unknown;
	}>
): Map<string, ProfileWithBlentoFlag> {
	const map = new Map<string, ProfileWithBlentoFlag>();

	for (const p of profiles) {
		const existing = map.get(p.did) ?? {
			did: p.did as Did,
			handle: (p.handle ?? p.did) as `${string}.${string}`,
			hasBlento: false
		};

		if (p.handle && p.handle !== 'handle.invalid') {
			existing.handle = p.handle as `${string}.${string}`;
		}

		const record = p.record as Record<string, unknown> | undefined;

		if (p.collection === 'app.bsky.actor.profile' && record) {
			existing.displayName ??= record.displayName as string | undefined;
			if (!existing.avatar && record.avatar) {
				const cdnUrl = getCDNImageBlobUrl({
					did: p.did,
					blob: record.avatar as { $type: 'blob'; ref: { $link: string } }
				});
				if (cdnUrl) existing.avatar = cdnUrl;
			}
		}

		if (p.collection === 'site.standard.publication' && record) {
			existing.hasBlento = true;
			existing.displayName = (record.name as string) ?? existing.displayName;
			existing.url = record.url as string | undefined;
			if (record.icon) {
				const cdnUrl = getCDNImageBlobUrl({
					did: p.did,
					blob: record.icon as { $type: 'blob'; ref: { $link: string } }
				});
				if (cdnUrl) existing.avatar = cdnUrl;
			}
		}

		map.set(p.did, existing);
	}

	return map;
}

export const UpdatedBlentosCardDefitition = {
	type: 'updatedBlentos',
	contentComponent: UpdatedBlentosCard,
	keywords: ['feed', 'updates', 'recent', 'activity'],
	loadDataServer: async (items, { platform }) => {
		try {
			const db = platform?.env?.DB;
			if (!db) return [];

			const client = getServerClient(db);
			const res = await client.get('app.blento.card.listRecords', {
				params: { limit: 200, profiles: true, sort: 'time_us', order: 'desc' }
			});

			if (!res.ok) return [];

			// Build profile map from contrail (includes bsky profile + blento publication)
			const profileMap = res.data.profiles ? extractProfiles(res.data.profiles) : new Map();

			// Extract unique DIDs in order of recency
			const seen = new Set<string>();
			const uniqueDids: string[] = [];
			for (const r of res.data.records) {
				if (!seen.has(r.did) && !r.did.endsWith('.pds.rip')) {
					seen.add(r.did);
					uniqueDids.push(r.did);
				}
			}

			return uniqueDids
				.slice(0, 20)
				.map((did) => profileMap.get(did))
				.filter(
					(v): v is ProfileWithBlentoFlag =>
						!!v && v.handle !== 'handle.invalid' && !v.handle.endsWith('.pds.rip')
				);
		} catch (error) {
			console.error('error fetching updated blentos', error);
			return [];
		}
	}
} as CardDefinition & { type: 'updatedBlentos' };
